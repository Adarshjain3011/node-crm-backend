
import responseHandler from "../utils/responseHandler.js";

import express from "express";

import { user_role } from "../utils/data.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import { createNewInvoice,getInvoiceFormDetails,updateInvoiceFormData,uploadInvoiceExcelAndPdf,deleteInvoiceForm, getAllInvoiceForm } from "../controllers/invoice.controller.js";

const router = express.Router();

// Route to create a new invoice

router.post("/create-new-invoice",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),createNewInvoice);

// Route to get specific Invoice

router.post("/get-invoice-details",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getInvoiceFormDetails);



// update invoice Form Data details 

router.post("/update-invoice-data",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateInvoiceFormData);

router.post("/upload-invoice-pdf",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),uploadInvoiceExcelAndPdf);

router.get("/delete-invoice-formData/:invoiceId",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),deleteInvoiceForm);

router.get("/get-all-invoice-form",authMiddleware,authorizeRoles(user_role.admin),getAllInvoiceForm);

export default router;



