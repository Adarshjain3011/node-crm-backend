
import express from "express";

import {

    createNewQuote,
    getAllQuoteRevisions,
    addNewVendorToQuote,
    removeVendorAtQuotes,
    updateQuoteItemDetails,
    updateRootFieldsAndItemAddDeleteAndUpdate,
    updateQuoteStatus

} from "../controllers/quote.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import { user_role } from "../utils/data.js";

const router = express.Router();


router.post("/create-new-quote",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),createNewQuote);

router.get("/get-all-quote-revisions/:enqueryId",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllQuoteRevisions);

router.post("/add-new-vendor-to-quote",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),addNewVendorToQuote);

router.post("/remove-vendor-at-quote",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),removeVendorAtQuotes);

router.post("/update-quote-item-details",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateQuoteItemDetails);

router.post("/update-root-fields-and-item-add-delete-and-update",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateRootFieldsAndItemAddDeleteAndUpdate);

router.post("/update-quote-status",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateQuoteStatus);

export default router;


