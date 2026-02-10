// shareUtils.ts - Convert posts to images with watermarks for sharing

import { SocialPost } from "../types";

/**
 * Parse Tailwind gradient classes to canvas gradient
 */
const parseGradientBackground = (
  ctx: CanvasRenderingContext2D,
  bgClass: string,
  width: number,
  height: number,
) => {
  // Default black background
  if (!bgClass || bgClass === "bg-transparent") {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
    return;
  }

  // Gradient mappings
  const gradients: Record<string, { colors: string[]; angle: number }> = {
    aurora: { colors: ["#9333ea", "#db2777", "#2563eb"], angle: 135 },
    cyber: { colors: ["#06b6d4", "#3b82f6", "#7c3aed"], angle: 135 },
    sunset: { colors: ["#f97316", "#db2777", "#7c3aed"], angle: 135 },
    forest: { colors: ["#10b981", "#0d9488", "#0891b2"], angle: 135 },
    fire: { colors: ["#dc2626", "#ea580c", "#eab308"], angle: 135 },
    cosmic: { colors: ["#667eea", "#764ba2", "#ec4899"], angle: 135 },
    ocean: { colors: ["#06b6d4", "#1d4ed8"], angle: 135 },
    emerald: { colors: ["#10b981", "#0f766e"], angle: 135 },
  };

  // Try to detect gradient type from class
  let gradientType = "aurora";
  for (const [key, value] of Object.entries(gradients)) {
    if (bgClass.toLowerCase().includes(key)) {
      gradientType = key;
      break;
    }
  }

  const config = gradients[gradientType];

  // Create gradient
  const angle = (config.angle * Math.PI) / 180;
  const x1 = width / 2 - (Math.cos(angle) * width) / 2;
  const y1 = height / 2 - (Math.sin(angle) * height) / 2;
  const x2 = width / 2 + (Math.cos(angle) * width) / 2;
  const y2 = height / 2 + (Math.sin(angle) * height) / 2;

  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);

  config.colors.forEach((color, idx) => {
    gradient.addColorStop(idx / (config.colors.length - 1), color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Wrap text to fit within canvas width
 */
const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  startY: number,
): { lines: string[]; totalHeight: number } => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine + word + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine !== "") {
      lines.push(currentLine.trim());
      currentLine = word + " ";
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return {
    lines,
    totalHeight: lines.length * lineHeight,
  };
};

/**
 * Convert a text post to an image with watermark
 */
export const convertTextPostToImage = async (
  post: SocialPost,
  appName: string = "ANONPRO",
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d")!;

    // Apply background
    if (post.background) {
      parseGradientBackground(
        ctx,
        post.background,
        canvas.width,
        canvas.height,
      );
    } else {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add post content
    ctx.font = "bold 56px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = canvas.width - 160; // 80px padding on each side
    const lineHeight = 80;

    const { lines } = wrapText(ctx, post.content, maxWidth, lineHeight, 0);

    // Calculate starting Y to center text vertically
    const totalTextHeight = lines.length * lineHeight;
    let y = (canvas.height - totalTextHeight) / 2 + lineHeight / 2;

    // Draw each line
    lines.forEach((line) => {
      // Text shadow for better readability
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;

      ctx.fillText(line, canvas.width / 2, y);
      y += lineHeight;
    });

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Add author (if not anonymous)
    if (post.authorAlias && post.authorAlias !== "Anonymous") {
      ctx.font = "32px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText(
        `@${post.authorAlias}`,
        canvas.width / 2,
        canvas.height - 150,
      );
    } else {
      // Anonymous post
      ctx.font =
        "bold 32px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = "rgba(168, 85, 247, 0.9)"; // Purple for anonymous
      ctx.fillText("Posted Anonymously", canvas.width / 2, canvas.height - 150);
    }

    // Add watermark at bottom
    ctx.font = "bold 28px Inter, -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(appName, canvas.width / 2, canvas.height - 80);

    // Add small logo/icon (you can customize this)
    ctx.font = "40px Arial";
    ctx.fillText("✨", canvas.width / 2 - 100, canvas.height - 70);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        }
      },
      "image/png",
      0.95,
    );
  });
};

/**
 * Add watermark to existing image
 */
export const addWatermarkToImage = async (
  imageUrl: string,
  appName: string = "ANONPRO",
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.crossOrigin = "anonymous"; // Handle CORS

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add semi-transparent overlay at bottom
      const overlayHeight = 80;
      const gradient = ctx.createLinearGradient(
        0,
        canvas.height - overlayHeight,
        0,
        canvas.height,
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        canvas.height - overlayHeight,
        canvas.width,
        overlayHeight,
      );

      // Add watermark text
      const fontSize = Math.max(canvas.width / 30, 20);
      ctx.font = `bold ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";

      // Shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.fillText(appName, canvas.width - 20, canvas.height - 20);

      // Add small icon
      ctx.font = `${fontSize * 1.2}px Arial`;
      ctx.fillText(
        "✨",
        canvas.width - 20 - ctx.measureText(appName).width - 15,
        canvas.height - 20,
      );

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          }
        },
        "image/png",
        0.95,
      );
    };

    img.onerror = () => {
      // If image fails to load, resolve with null
      canvas.toBlob((blob) => resolve(blob!), "image/png");
    };

    img.src = imageUrl;
  });
};

/**
 * Share a post with proper image generation
 */
export const sharePost = async (
  post: SocialPost,
  appName: string = "ANONPRO",
): Promise<void> => {
  try {
    let imageBlob: Blob | null = null;

    // If post has an image, add watermark to it
    if (post.fileUrl) {
      imageBlob = await addWatermarkToImage(post.fileUrl, appName);
    }
    // If post has text with background, convert to image
    else if (post.content && (post.background || post.content.length > 100)) {
      imageBlob = await convertTextPostToImage(post, appName);
    }

    // If we generated an image, share it
    if (imageBlob && navigator.share) {
      const file = new File([imageBlob], "post.png", { type: "image/png" });

      try {
        await navigator.share({
          files: [file],
          title: post.authorAlias
            ? `Post by @${post.authorAlias}`
            : "Anonymous Post",
          text:
            post.content.substring(0, 100) +
            (post.content.length > 100 ? "..." : ""),
        });
        return;
      } catch (shareError) {
        console.log("Native share with image failed, falling back...");
      }
    }

    // Fallback: Download the image
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "post.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    // Last resort: Copy text to clipboard
    const shareText = post.content + `\n\nShared via ${appName}`;
    await navigator.clipboard.writeText(shareText);
    alert("Post text copied to clipboard!");
  } catch (error) {
    console.error("Share error:", error);
    // Final fallback
    try {
      await navigator.clipboard.writeText(post.content);
      alert("Post copied to clipboard!");
    } catch (e) {
      console.error("Clipboard error:", e);
    }
  }
};

/**
 * Check if Web Share API with files is supported
 */
export const canShareFiles = (): boolean => {
  return (
    navigator.share && navigator.canShare && navigator.canShare({ files: [] })
  );
};
