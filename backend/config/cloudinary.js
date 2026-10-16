import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

const uploadOnCloudinary = async (filePath) => {
  if (!filePath) return "";

  // Check if real, non-placeholder Cloudinary credentials are provided
  const cloudName = process.env.CLOUD_NAME?.trim();
  const apiKey = process.env.API_KEY?.trim();
  const apiSecret = process.env.API_SECRET?.trim();

  const isConfigured =
    cloudName &&
    cloudName !== "your_cloudinary_cloud_name" &&
    apiKey &&
    apiKey !== "your_cloudinary_api_key" &&
    apiSecret &&
    apiSecret !== "your_cloudinary_api_secret";

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
      });
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
      return uploadResult.secure_url;
    } catch (error) {
      console.warn("Cloudinary upload failed, using local storage fallback:", error.message || error);
    }
  }

  // Fallback: Read file and return as persistent base64 data URI
  try {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase().replace(".", "") || "png";
      const mime =
        ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "webp"
          ? "image/webp"
          : ext === "gif"
          ? "image/gif"
          : ext === "mp3" || ext === "webm" || ext === "wav" || ext === "ogg"
          ? `audio/${ext}`
          : "image/png";

      const base64Data = fileBuffer.toString("base64");
      const dataUri = `data:${mime};base64,${base64Data}`;

      // Clean up local temp file after encoding
      try {
        fs.unlinkSync(filePath);
      } catch (e) {}

      return dataUri;
    }
  } catch (err) {
    console.error("Local fallback storage error:", err);
  }

  return "";
};

export default uploadOnCloudinary;