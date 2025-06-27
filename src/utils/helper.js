

import { User } from "../config/models.js";

import fs from "fs";

export async function checkUserExists(userId) {

    try {

        const isuserExists = await User.findById(userId);

        return isuserExists;

    } catch (error) {

        console.log(error);

        throw new Error("user does not exists with given id");
    }

}


// Helper to delete temp files synchronously

export function deleteTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log("Temp file deleted:", filePath);
    } catch (err) {
      console.error("Error deleting temp file:", err);
    }
  }
}

