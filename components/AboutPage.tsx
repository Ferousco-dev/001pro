import React, { useEffect, useMemo, useState } from "react";

type Tier = "creator" | "contributor";
type PaletteKey = "blue" | "purple" | "emerald" | "rose" | "orange";

type TeamMember = {
  name: string;
  role: string;
  img?: string;
  tier: Tier;
  href?: string;
};

type Partner = {
  name: string;
  logo: string;
  website: string;
  description: string;
};

const TEAM: TeamMember[] = [
  {
    name: "Paradox Overlord",
    role: "Creator • Senior Engineer • Frontend Lead • Architect",
    img: "https://files.catbox.moe/nxukd5.jpg",
    tier: "creator",
  },
  {
    name: "Feranmi",
    role: "Creator • Backend Lead • Database Management",
    img: "https://files.catbox.moe/6vddmu.jpeg",
    tier: "creator",
  },
  {
    name: "Eddyrus",
    role: "Course Representative",
    img: "https://files.catbox.moe/dfyagt.jpg",
    tier: "creator",
  },
  {
    name: "Sage",
    role: "Overview & Thoughts",
    img: "https://files.catbox.moe/86p1t2.jpg",
    tier: "contributor",
  },
  {
    name: "Sanbyte Tech",
    role: "Code Review & Quality Assurance",
    img: "https://files.catbox.moe/ut3lc8.jpg",
    tier: "contributor",
  },
];

const PARTNERS: Partner[] = [
  {
    name: "Partner Name",
    logo: "https://files.catbox.moe/x1c72s.png",
    website: "https://thesdel.com", // Placeholder until user provides link
    description:
      "A strategic partner collaborating with Genesis Devs to expand the reach of secure, anonymous communication.",
  },
];

const PALETTES: Record<
  PaletteKey,
  { a: string; b: string; ring: string; subtle: string }
> = {
  blue: {
    a: "#60a5fa",
    b: "#8b5cf6",
    ring: "rgba(96,165,250,.35)",
    subtle: "rgba(96,165,250,.08)",
  },
  purple: {
    a: "#a78bfa",
    b: "#f472b6",
    ring: "rgba(167,139,250,.35)",
    subtle: "rgba(167,139,250,.08)",
  },
  emerald: {
    a: "#34d399",
    b: "#22d3ee",
    ring: "rgba(52,211,153,.35)",
    subtle: "rgba(52,211,153,.08)",
  },
  rose: {
    a: "#fb7185",
    b: "#f472b6",
    ring: "rgba(251,113,133,.35)",
    subtle: "rgba(251,113,133,.08)",
  },
  orange: {
    a: "#f59e0b",
    b: "#fb7185",
    ring: "rgba(245,158,11,.35)",
    subtle: "rgba(245,158,11,.10)",
  },
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

interface AboutPageProps {
  onOpenProfile?: (member: TeamMember & { slug: string; href: string }) => void;
  initialPalette?: PaletteKey;
  initialView?: "grid" | "list";
}

const AboutPage: React.FC<AboutPageProps> = ({
  onOpenProfile,
  initialPalette = "blue",
  initialView = "grid",
}) => {
  // palette + persist
  const [palette, setPalette] = useState<PaletteKey>(initialPalette);
  useEffect(() => {
    const saved = localStorage.getItem("about_palette") as PaletteKey | null;
    if (saved && PALETTES[saved]) setPalette(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("about_palette", palette);
  }, [palette]);

  // filters + layout
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<Tier | "all">("all");
  const [view, setView] = useState<"grid" | "list">(initialView);

  // member modal
  const [selected, setSelected] = useState<TeamMember | null>(null);

  // derived vars
  const { a, b, ring, subtle } = PALETTES[palette];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEAM.filter((m) => {
      if (tier !== "all" && m.tier !== tier) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.tier.toLowerCase().includes(q)
      );
    });
  }, [query, tier]);

  const stats = useMemo(() => {
    const creators = TEAM.filter((t) => t.tier === "creator").length;
    const contributors = TEAM.filter((t) => t.tier === "contributor").length;
    return { total: TEAM.length, creators, contributors, version: "4.0.0" };
  }, []);

  const openProfile = (m: TeamMember) => {
    const slug = slugify(m.name);
    const href = m.href || `/team/${slug}`;
    if (onOpenProfile) {
      onOpenProfile({ ...m, slug, href });
      return;
    }
    // default: navigate
    window.location.href = href;
  };

  return (
    <main
      className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-[calc(env(safe-area-inset-bottom)+96px)] space-y-16 sm:space-y-20"
      style={
        {
          // palette vars
          ["--a" as any]: a,
          ["--b" as any]: b,
          ["--ring" as any]: ring,
          ["--subtle" as any]: subtle,
        } as React.CSSProperties
      }
    >
      {/* aura */}
      <div className="pointer-events-none absolute -z-10 inset-0">
        <div
          className="absolute left-1/2 -translate-x-1/2 top-24 w-[520px] h-[520px] rounded-full blur-[140px]"
          style={{ background: "var(--subtle)" }}
        />
      </div>

      {/* header / hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.35em] ring-1"
          style={{
            color: "var(--a)",
            borderColor: "var(--ring)",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "saturate(180%) blur(14px)",
            WebkitBackdropFilter: "saturate(180%) blur(14px)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--a)" }}
          />
          The Genesis Team
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white">
          GENESIS{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(90deg, var(--a), var(--b))",
            }}
          >
            DEVS
          </span>
        </h1>

        <p className="text-neutral-400 font-medium max-w-2xl mx-auto text-lg leading-relaxed">
          The architectural core from{" "}
          <span className="text-neutral-200">Great Ife</span> building a clean
          protocol for anonymous discourse.
        </p>

        {/* controls */}
        <div className="w-full max-w-3xl flex flex-col md:flex-row gap-4 md:items-center md:justify-center">
          {/* search */}
          <div
            className="flex-1 min-w-[200px] rounded-2xl px-4 py-2.5 ring-1"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "saturate(180%) blur(14px)",
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, role, or tier…"
              className="w-full bg-transparent outline-none text-sm text-white placeholder-neutral-500"
            />
          </div>

          {/* tier filter */}
          <div className="flex items-center gap-2">
            {[
              { k: "all", label: "All" },
              { k: "creator", label: "Creators" },
              { k: "contributor", label: "Contributors" },
            ].map((t) => {
              const active = (tier as any) === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setTier(t.k as any)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    color: active ? "#0b0b0d" : "#d4d4d8",
                    background: active ? "var(--a)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* view + palette */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                view === "grid" ? "text-black" : "text-neutral-300"
              }`}
              style={{
                background:
                  view === "grid" ? "var(--a)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                view === "list" ? "text-black" : "text-neutral-300"
              }`}
              style={{
                background:
                  view === "list" ? "var(--a)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              aria-label="List view"
            >
              List
            </button>

            {/* palette switcher */}
            <div
              className="ml-2 flex items-center gap-1.5 rounded-xl px-2 py-2 ring-1"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.06)",
              }}
              aria-label="Palette"
            >
              {Object.keys(PALETTES).map((k) => {
                const key = k as PaletteKey;
                return (
                  <button
                    key={key}
                    onClick={() => setPalette(key)}
                    title={`${key} palette`}
                    className="w-5 h-5 rounded-full ring-2 transition-transform hover:scale-110"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${PALETTES[key].a}, ${PALETTES[key].b})`,
                      boxShadow:
                        key === palette
                          ? "0 0 0 2px rgba(255,255,255,0.9) inset"
                          : "none",
                    }}
                    aria-pressed={key === palette}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* team section */}
      <section aria-label="Team">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-500">
            No matches. Try another search.
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filtered.map((m) => {
              const initial = m.name[0]?.toUpperCase() || "?";
              const slug = slugify(m.name);
              const href = m.href || `/team/${slug}`;
              const isCore = m.tier === "creator";
              return (
                <article
                  key={m.name}
                  className="group relative rounded-[28px] p-5 sm:p-6 transition-transform hover:-translate-y-1.5"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "saturate(180%) blur(22px)",
                    WebkitBackdropFilter: "saturate(180%) blur(22px)",
                    border: `1px solid ${
                      isCore ? "var(--ring)" : "rgba(255,255,255,0.10)"
                    }`,
                  }}
                >
                  {/* avatar */}
                  <div className="relative mx-auto mb-5 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-1 ring-white/10">
                    {m.img ? (
                      <img
                        src={m.img}
                        alt={`${m.name} portrait`}
                        className="w-full h-full object-cover transition-[filter,transform] duration-300 group-hover:brightness-110 group-hover:scale-[1.02]"
                        loading="lazy"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    ) : (
                      <div
                        className="w-full h-full grid place-items-center text-white text-3xl font-bold"
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, var(--a), var(--b))",
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    {/* hover overlay */}
                    <button
                      onClick={() => setSelected(m)}
                      className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 group-hover:opacity-100 group-hover:bg-black/30 transition"
                      aria-label={`Quick view ${m.name}`}
                    >
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-black"
                        style={{ background: "var(--a)" }}
                      >
                        Quick view
                      </span>
                    </button>
                    {isCore && (
                      <span
                        className="absolute -bottom-2 -right-2 rounded-xl px-2.5 py-1 text-[10px] font-black tracking-wider text-white shadow-lg"
                        style={{ background: "var(--a)" }}
                      >
                        CORE
                      </span>
                    )}
                  </div>

                  {/* info */}
                  <div className="text-center space-y-2">
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        openProfile(m);
                      }}
                      className="text-white font-extrabold tracking-tight text-lg sm:text-xl hover:underline underline-offset-4"
                    >
                      {m.name}
                    </a>
                    <p
                      className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest"
                      style={{ color: isCore ? "var(--a)" : "#9ca3af" }}
                    >
                      {m.role}
                    </p>
                  </div>

                  {/* actions */}
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <a
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        openProfile(m);
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-black"
                      style={{ background: "var(--a)" }}
                    >
                      View profile
                    </a>
                    <button
                      onClick={() => setSelected(m)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          // list view
          <div className="space-y-3">
            {filtered.map((m) => {
              const slug = slugify(m.name);
              const href = m.href || `/team/${slug}`;
              return (
                <button
                  key={m.name}
                  onClick={() => openProfile(m)}
                  className="w-full text-left flex items-center gap-4 p-4 rounded-2xl transition hover:bg-white/5 ring-1 ring-white/10"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    backdropFilter: "saturate(180%) blur(18px)",
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/10">
                    {m.img ? (
                      <img
                        src={m.img}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage:
                            "linear-gradient(135deg, var(--a), var(--b))",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white">{m.name}</div>
                    <div className="text-xs text-neutral-400">{m.role}</div>
                  </div>
                  <div
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                    style={{
                      color: "var(--a)",
                      background: "rgba(255,255,255,0.06)",
                    }}
                  >
                    {m.tier}
                  </div>
                  <span className="text-neutral-400 text-sm" aria-hidden>
                    →
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* stats */}
      <section
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-3xl p-5 ring-1"
        style={{
          borderColor: "rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "saturate(180%) blur(16px)",
        }}
      >
        {[
          { label: "Total", value: stats.total },
          { label: "Creators", value: stats.creators },
          { label: "Contributors", value: stats.contributors },
        ].map((s) => (
          <div key={s.label} className="text-center py-2">
            <div
              className="text-3xl font-black tracking-tight"
              style={
                {
                  backgroundImage: "linear-gradient(90deg, var(--a), var(--b))",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                } as any
              }
            >
              {s.value}
            </div>
            <div className="text-[11px] font-black uppercase tracking-[0.35em] text-neutral-400 mt-1">
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* partnerships */}
      <section aria-label="Partnerships">
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] ring-1"
            style={{
              color: "var(--a)",
              borderColor: "var(--ring)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            Official Partnership
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Collaborating for <span style={{ color: "var(--a)" }}>Growth</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          {PARTNERS.map((p) => (
            <div
              key={p.name}
              className="group relative overflow-hidden rounded-[32px] p-6 sm:p-10 ring-1 transition-all hover:ring-white/20"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.06)",
                backdropFilter: "saturate(180%) blur(20px)",
              }}
            >
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* logo container */}
                <div className="shrink-0 w-full md:w-64 aspect-[2/1] bg-black/40 rounded-3xl overflow-hidden ring-1 ring-white/10 group-hover:ring-white/20 transition-all flex items-center justify-center p-8">
                  <img
                    src={p.logo}
                    alt={p.name}
                    className="w-full h-full object-contain filter brightness-90 contrast-125 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                    {p.name}
                  </h3>
                  <p className="text-neutral-400 font-medium leading-relaxed max-w-xl">
                    {p.description}
                  </p>
                  <div className="pt-2">
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-blue-500/10"
                      style={{ background: "var(--a)" }}
                    >
                      View Details
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* decorative accent */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none"
                style={{ background: "var(--a)" }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* manifesto */}
      <section
        className="rounded-[36px] p-6 sm:p-10 md:p-14 ring-1 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]"
        style={{
          borderColor: "rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "saturate(180%) blur(16px)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl grid place-items-center text-white shadow-xl ring-1 ring-white/10"
                style={{ background: "var(--a)" }}
              >
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.4}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Anonymity Manifesto
                </h2>
                <div
                  className="text-[10px] font-black uppercase tracking-[0.45em]"
                  style={{ color: "var(--a)" }}
                >
                  Version {stats.version} • Stable
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-neutral-300 text-base sm:text-lg leading-relaxed">
              <p>
                AnonChat Pro is a communication protocol, not a social network.
                Speaking without a face can be essential to honest, academic
                discourse.
              </p>
              <p>
                Built for the Great Ife community: no tracking, no permanent
                logs, no central identity registry. Clean, ephemeral
                conversations — by design.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="px-4 py-2 rounded-xl font-semibold text-black"
                style={{ background: "var(--a)" }}
              >
                Read the spec
              </a>
              <a
                href="#"
                className="px-4 py-2 rounded-xl font-semibold text-neutral-200"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                Download brand kit
              </a>
            </div>
          </div>

          <div
            className="rounded-3xl p-8 text-center relative overflow-hidden ring-1 ring-white/10"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "saturate(180%) blur(22px)",
            }}
          >
            <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.35em]">
              Protocol Status
            </div>
            <div
              className="mt-3 text-5xl font-black tracking-tight"
              style={{ color: "var(--a)" }}
            >
              ENCRYPTED
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <div className="flex justify-center gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-4 rounded-full bg-white/15 animate-pulse"
                    style={{
                      animationDelay: `${i * 120}ms`,
                      background: "var(--subtle)",
                    }}
                  />
                ))}
              </div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.35em] mt-4">
                Zero-Trace Link Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* member modal */}
      {selected && (
        <div className="fixed inset-0 z-[60]">
          <button
            aria-label="Close"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 mx-auto w-full max-w-lg rounded-3xl overflow-hidden ring-1 ring-white/10"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "saturate(200%) blur(24px)",
            }}
          >
            <div className="p-6 flex items-center gap-4 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/10">
                {selected.img ? (
                  <img
                    src={selected.img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, var(--a), var(--b))",
                    }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-white text-lg truncate">
                  {selected.name}
                </div>
                <div
                  className="text-xs uppercase tracking-widest"
                  style={{ color: "var(--a)" }}
                >
                  {selected.tier}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto px-3 py-2 rounded-xl text-sm text-neutral-200"
                style={{ background: "rgba(255,255,255,0.10)" }}
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="text-neutral-300">{selected.role}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selected.name);
                  }}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-black"
                  style={{ background: "var(--a)" }}
                >
                  Copy name
                </button>
                <button
                  onClick={() => openProfile(selected)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold text-neutral-200"
                  style={{ background: "rgba(255,255,255,0.10)" }}
                >
                  View profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* helpers */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse { animation: none !important; }
        }
      `}</style>
    </main>
  );
};

export default AboutPage;
