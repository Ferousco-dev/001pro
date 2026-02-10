const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;

export interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Upload an image to IMGBB
 * @param file The image file or base64 string to upload
 * @returns The URL of the uploaded image
 */
export const uploadToImgBB = async (
  file: File | string,
): Promise<string | null> => {
  if (!IMGBB_API_KEY) {
    console.error("IMGBB API Key is missing");
    throw new Error("IMGBB API Key is not configured");
  }

  const formData = new FormData();

  // If input is base64 string
  if (typeof file === "string") {
    // Remove header if present (e.g., "data:image/jpeg;base64,")
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    formData.append("image", base64Data);
  } else {
    // If input is File object
    formData.append("image", file);
  }

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data: ImgBBResponse = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      console.error("IMGBB Upload Failed:", data);
      throw new Error("Failed to upload image to IMGBB");
    }
  } catch (error) {
    console.error("Error uploading to IMGBB:", error);
    throw error;
  }
};

/**
 * Compress an image file before upload
 * @param file The original file
 * @param maxWidth Max width for resized image
 * @param quality JPEG quality (0 to 1)
 * @returns Promise that resolves with compressed base64 string
 */
export const compressImage = (
  file: File,
  maxWidth = 1080,
  quality = 0.8,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;

        const ctx = elem.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 string
        const data = elem.toDataURL("image/jpeg", quality);
        resolve(data);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
