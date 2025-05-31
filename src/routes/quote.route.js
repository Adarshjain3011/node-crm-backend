
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

const router = express.Router();


router.post("/create-new-quote", createNewQuote);

router.get("/get-all-quote-revisions/:enqueryId", getAllQuoteRevisions);

router.post("/add-new-vendor-to-quote", addNewVendorToQuote);

router.post("/remove-vendor-at-quote", removeVendorAtQuotes);

router.post("/update-quote-item-details", updateQuoteItemDetails);

router.post("/update-root-fields-and-item-add-delete-and-update", updateRootFieldsAndItemAddDeleteAndUpdate);

router.post("/update-quote-status",updateQuoteStatus);

export default router;


