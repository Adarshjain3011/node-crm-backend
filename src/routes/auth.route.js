
import express from "express";

import { login, logout } from "../controllers/auth.controller.js";

import { Client, Quote } from "../config/models.js";

const router = express.Router();


router.post("/login", login);

router.get("/logout", logout);


router.get("/update-to-array", async (req, res) => {
    try {
        const clients = await Quote.find({
            image: { $exists: true, $not: { $type: "array" } }
        });

        for (const client of clients) {
            let image = client.image;

            if (typeof image === "string") {
                try {
                    // Try to parse stringified JSON
                    image = JSON.parse(image);

                    // In some cases, parsed value may still be a string (not valid JSON)
                    // or deeply nested: [[...]]
                    while (Array.isArray(image) && image.length === 1 && Array.isArray(image[0])) {
                        image = image[0]; // flatten
                    }

                    // If it's not an array, make it an array
                    if (!Array.isArray(image)) {
                        image = [image];
                    }

                    // Ensure all elements are strings
                    image = image.map(String);
                } catch (err) {
                    // If not JSON-parsable, treat as raw string
                    image = [String(image)];
                }
            } else {
                // Wrap directly if not already an array
                image = [String(image)];
            }

            client.image = image;
            await client.save();
        }

        res.status(200).json({
            message: `${clients.length} documents updated to have image as an array.`
        });
    } catch (error) {
        console.error("Error updating image fields:", error);
        res.status(500).json({ message: "Failed to update image fields." });
    }
});





export default router;

