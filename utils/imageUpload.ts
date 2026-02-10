const IMGBB_API_KEY = 'c87bccaa8061a9321d7a7fd758fbc3b2';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

export interface ImgbbResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string; // Direct image URL
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: string;
    expiration: string;
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
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * Upload an image to imgbb
 * @param imageFile The image file to upload
 * @returns Promise with the uploaded image URL
 */
export async function uploadImageToImgbb(imageFile: File): Promise<string> {
  try {
    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 32MB for imgbb)
    const maxSize = 32 * 1024 * 1024; // 32MB
    if (imageFile.size > maxSize) {
      throw new Error('Image file size must be less than 32MB');
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('key', IMGBB_API_KEY);

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result: ImgbbResponse = await response.json();

    if (!result.success) {
      throw new Error('Upload failed: API returned success=false');
    }

    return result.data.url; // Return the direct image URL
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple images to imgbb
 * @param imageFiles Array of image files to upload
 * @returns Promise with array of uploaded image URLs
 */
export async function uploadMultipleImagesToImgbb(imageFiles: File[]): Promise<string[]> {
  try {
    const uploadPromises = imageFiles.map(file => uploadImageToImgbb(file));
    const results = await Promise.allSettled(uploadPromises);

    const successfulUploads: string[] = [];
    const failedUploads: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulUploads.push(result.value);
      } else {
        console.error(`Failed to upload image ${index + 1}:`, result.reason);
        failedUploads.push(`Image ${index + 1}`);
      }
    });

    if (failedUploads.length > 0) {
      throw new Error(`Failed to upload: ${failedUploads.join(', ')}`);
    }

    return successfulUploads;
  } catch (error) {
    console.error('Multiple image upload error:', error);
    throw error;
  }
}

/**
 * Validate image file before upload
 * @param file The file to validate
 * @returns boolean indicating if file is valid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }

  // Check file size (max 32MB)
  const maxSize = 32 * 1024 * 1024; // 32MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'Image file size must be less than 32MB' };
  }

  // Check file size (min 1KB to avoid empty files)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    return { isValid: false, error: 'Image file is too small' };
  }

  return { isValid: true };
}

/**
 * Get image dimensions (useful for preview)
 * @param file The image file
 * @returns Promise with image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}