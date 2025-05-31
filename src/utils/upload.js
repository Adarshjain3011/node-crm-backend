import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const uploadImage = async (filePath) => {
  try {
    console.log("Uploading file to Cloudinary:", filePath);

    // Validate file path
    if (!filePath) {
      throw new Error("No file path provided for upload.");
    }

    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(filePath, {
      folder: "invoice",
      resource_type: "auto", // Allows any file type (PDF, images, etc.)
    });

    console.log("Uploaded File URL:", response.secure_url);
    return response; // Return the full response object for more flexibility
  } catch (error) {
    console.error("Cloudinary Upload Error:", error.message);
    throw error; // Throw the error to let the calling function handle it
  }
};

export default uploadImage;