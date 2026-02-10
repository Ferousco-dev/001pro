export const uploadToCatbox = async (file: File | string): Promise<string> => {
  const formData = new FormData();
  formData.append("reqtype", "fileupload");

  if (typeof file === "string") {
    // Convert base64 to blob
    const base64Response = await fetch(file);
    const blob = await base64Response.blob();
    formData.append("fileToUpload", blob, "image.jpg");
  } else {
    formData.append("fileToUpload", file);
  }

  try {
    const response = await fetch("/catbox-proxy/user/api.php", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const responseText = await response.text();

    // Catbox returns the URL directly in the body on success
    if (responseText.startsWith("http")) {
      return responseText;
    } else {
      throw new Error(responseText || "Upload failed");
    }
  } catch (error) {
    console.error("Catbox upload error:", error);
    throw error;
  }
};
