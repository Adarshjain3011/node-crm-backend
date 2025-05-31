

import { createNewInvoice } from "../controllers/invoice.controller.js";

import responseHandler from "../utils/responseHandler.js";

import express from "express";

const router = express.Router();

// Route to create a new invoice

router.post("/create-new-invoice", createNewInvoice);

// Route to get all invoices

router.get("/get-invoice", async (req, res) => {

    return responseHandler(res, 200, true, "Invoices fetched successfully", []);

})

export default router;

