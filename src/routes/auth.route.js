
import express from "express";

import { login, logout } from "../controllers/auth.controller.js";

import { Client } from "../config/models.js";

const router = express.Router();


router.post("/login", login);

router.get("/logout", logout);


router.get("/update-to-array", async (req, res) => {
    try {
        const clients = await Client.find({
            assignedTo: { $exists: true, $not: { $type: "array" } }
        });

        for (const client of clients) {
            client.assignedTo = [client.assignedTo];
            await client.save();
        }

        res.status(200).json({
            message: `${clients.length} documents updated to have assignedTo as an array.`
        });
    } catch (error) {
        console.error("Error updating assignedTo fields:", error);
        res.status(500).json({ message: "Failed to update assignedTo fields." });
    }
});



export default router;

