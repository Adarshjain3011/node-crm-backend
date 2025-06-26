import fs from "fs";
import path from "path";
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

    // Extract file extension and name
    const ext = path.extname(filePath); // e.g., '.pdf', '.xlsx'
    const fileName = path.basename(filePath, ext); // filename without extension
    const fullFileName = `${fileName}${ext}`; // ensures extension is preserved

    // Define raw file types
    const rawExtensions = [".pdf", ".docx", ".pptx", ".xlsx"];
    const isRawFile = rawExtensions.includes(ext.toLowerCase());

    console.log("file name : ",fileName);

    console.log("full name is : ",fullFileName);

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(filePath, {
      folder: "invoice",
      resource_type: isRawFile ? "raw" : "auto",
      public_id: fullFileName, // preserves filename and extension
    });
    

    console.log("✅ Uploaded File URL:", response.secure_url);
    return response; // Return the full response for flexibility
  } catch (error) {
    console.error("❌ Cloudinary Upload Error:", error.message);
    throw error;
  }
};

export default uploadImage;

