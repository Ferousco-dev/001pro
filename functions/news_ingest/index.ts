// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime"; // ensures Edge runtime in some setups
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Feed = { url: string; category: "nigeria" | "world"; source: string };

const FEEDS: Feed[] = [
  // Nigeria
  {
    url: "https://guardian.ng/feed/",
    category: "nigeria",
    source: "The Guardian Nigeria",
  },
  { url: "https://punchng.com/feed/", category: "nigeria", source: "Punch" },
  {
    url: "https://www.premiumtimesng.com/feed",
    category: "nigeria",
    source: "Premium Times",
  },
  {
    url: "https://www.channelstv.com/feed/",
    category: "nigeria",
    source: "Channels TV",
  },
  {
    url: "https://www.vanguardngr.com/feed/",
    category: "nigeria",
    source: "Vanguard",
  },
  // World
  {
    url: "https://feeds.bbci.co.uk/news/world/rss.xml",
    category: "world",
    source: "BBC World",
  },
  {
    url: "https://feeds.reuters.com/reuters/worldNews",
    category: "world",
    source: "Reuters",
  },
  {
    url: "https://www.aljazeera.com/xml/rss/all.xml",
    category: "world",
    source: "Al Jazeera",
  },
  {
    url: "https://www.theguardian.com/world/rss",
    category: "world",
    source: "The Guardian",
  },
];

const parseImageFromItem = (item: Element): string | null => {
  // media:content or enclosure
  const media = item.querySelector("media\\:content, content");
  if (media?.getAttribute("url")) return media.getAttribute("url");

  const enclosure = item.querySelector("enclosure");
  if (enclosure?.getAttribute("url")) return enclosure.getAttribute("url");

  // sometimes description/content:encoded has an <img>
  const fields = ["description", "content\\:encoded"];
  for (const f of fields) {
    const el = item.querySelector(f);
    const html = el?.textContent || "";
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m?.[1]) return m[1];
  }

  return null;
};

const text = (el: Element | null) => (el?.textContent || "").trim();

const parseRSS = async (xmlText: string, feed: Feed) => {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const items = Array.from(doc.querySelectorAll("item"));
  const out = items.map((it) => {
    const title = text(it.querySelector("title"));
    const link = text(it.querySelector("link"));
    const pub =
      text(it.querySelector("pubDate")) || text(it.querySelector("published"));
    const summary = text(it.querySelector("description"));
    const image = parseImageFromItem(it);
    const published_at = pub
      ? new Date(pub).toISOString()
      : new Date().toISOString();

    return {
      title,
      summary,
      url: link,
      image_url: image,
      source_name: feed.source,
      category: feed.category,
      published_at,
    };
  });
  // filter junk
  return out.filter((x) => x.title && x.url);
};

Deno.serve(async (req) => {
  try {
    const batches = await Promise.all(
      FEEDS.map(async (feed) => {
        const res = await fetch(feed.url, {
          headers: { "User-Agent": "AnonProNewsBot/1.0" },
        });
        const xml = await res.text();
        const items = await parseRSS(xml, feed);
        return items;
      })
    );

    const all = batches.flat();

    // upsert by unique url
    const { error } = await supabase.from("news").upsert(
      all.map((n) => ({
        title: n.title,
        summary: n.summary?.slice(0, 2000) ?? null,
        url: n.url,
        image_url: n.image_url,
        source_name: n.source_name,
        category: n.category,
        published_at: n.published_at,
      })),
      { onConflict: "url", ignoreDuplicates: false }
    );

    if (error) throw error;

    // return latest 20 for dev visibility
    const { data: latest } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({ inserted: all.length, latest }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: { "content-type": "application/json" },
      status: 500,
    });
  }
});
