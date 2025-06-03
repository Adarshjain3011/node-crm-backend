

import { createNewInvoice } from "../controllers/invoice.controller.js";

import responseHandler from "../utils/responseHandler.js";

import express from "express";

import { user_role } from "../utils/data.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// Route to create a new invoice

router.post("/create-new-invoice",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),createNewInvoice);

// Route to get all invoices

router.get("/get-invoice", async (req, res) => {

    return responseHandler(res, 200, true, "Invoices fetched successfully", []);

})

export default router;

