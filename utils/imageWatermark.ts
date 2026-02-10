/**
 * Add watermark to image for sharing
 */
export const addWatermarkToImage = async (
  imageUrl: string,
  appName: string = "ANONPRO"
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Add watermark at bottom-right
      const fontSize = Math.max(20, img.width / 40);
      ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";

      const text = `@${appName}`;
      const textMetrics = ctx.measureText(text);
      const padding = 20;
      const x = canvas.width - padding;
      const y = canvas.height - padding;

      // Draw semi-transparent background for text
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(
        x - textMetrics.width - padding / 2,
        y - fontSize - padding / 2,
        textMetrics.width + padding,
        fontSize + padding / 2
      );

      // Draw text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(text, x, y);

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageUrl;
  });
};
