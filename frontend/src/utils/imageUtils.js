import { API_URL } from "./config";

export const getCoverUrl = (coverImage) => {
  if (!coverImage) return null;

  if (coverImage.startsWith("http")) {
    return coverImage.replace(/^http:/, "https:");
  }

  // If it's a relative path (e.g. from local upload or asset), return as is
  if (coverImage.startsWith("/")) {
    return coverImage;
  }

  // Otherwise treat as external URL needing proxy
  return `${API_URL}/proxy/image?url=${encodeURIComponent(coverImage)}`;
};
