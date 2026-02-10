import { SocialPost } from "../types";

/**
 * Convert text post to image for sharing
 * Preserves background colors and typography
 */
export const convertTextPostToImage = async (
  post: SocialPost
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    // Parse background color from Tailwind classes
    let backgroundColor = "#000000"; // Default black
    let textColor = "#ffffff";

    if (post.background) {
      // Extract gradient colors from Tailwind classes
      // Examples: "bg-gradient-to-br from-blue-500 to-purple-600"
      if (
        post.background.includes("from-blue-500") &&
        post.background.includes("to-purple-600")
      ) {
        // Create gradient
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(0, "#3b82f6"); // blue-500
        gradient.addColorStop(1, "#9333ea"); // purple-600
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (post.background.includes("from-purple-500")) {
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(0, "#a855f7"); // purple-500
        gradient.addColorStop(1, "#ec4899"); // pink-500
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (post.background.includes("from-pink-500")) {
        const gradient = ctx.createLinearGradient(
          0,
          0,
          canvas.width,
          canvas.height
        );
        gradient.addColorStop(0, "#ec4899"); // pink-500
        gradient.addColorStop(1, "#f59e0b"); // amber-500
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Solid color fallback
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      textColor = "#ffffff";
    } else {
      // Default black background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      textColor = "#ffffff";
    }

    // Add text content with word wrapping
    ctx.fillStyle = textColor;
    ctx.font = "bold 48px Inter, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const maxWidth = canvas.width - 100;
    const words = post.content.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate vertical positioning (centered)
    const lineHeight = 70;
    const totalHeight = lines.length * lineHeight;
    let startY = (canvas.height - totalHeight) / 2 + lineHeight / 2;

    // Draw text lines
    lines.forEach((line) => {
      ctx.fillText(line, canvas.width / 2, startY);
      startY += lineHeight;
    });

    // Add author info at bottom
    ctx.font = "24px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillText(`@${post.authorAlias}`, canvas.width / 2, canvas.height - 50);

    resolve(canvas.toDataURL("image/jpeg", 0.9));
  });
};
