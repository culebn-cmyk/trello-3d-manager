// Google Apps Script Web App URL
const DRIVE_UPLOAD_URL =
  "https://script.google.com/macros/s/AKfycbyVxKFPJIaeqLMuiSiQ5VH0ADLkKuvziiwunOC6UIDEgCzsS2mCizuQ5gYtq9S044v9/exec";

/**
 * Upload file to Google Drive via Apps Script
 * @param file - File object to upload
 * @returns Promise with { success, url, fileId, error }
 */
export const uploadToDrive = async (file: File): Promise<{
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}> => {
  try {
    const formData = new FormData();
    formData.append("fileName", file.name);
    formData.append("mimeType", file.type);
    formData.append("file", file);

    const response = await fetch(DRIVE_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.url,
        fileId: result.fileId,
      };
    } else {
      return {
        success: false,
        error: result.message || "Upload failed",
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
