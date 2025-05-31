
import express from "express";

import {

    createNewQuery,
    getAllEnquery,
    assignVendorToEnquiry,
    deleteVendorAssignment,
    addNewFollowups,
    getAllSalesPersonData,
    respondToFollowUps,
    getSpecificEnqueryData

} from "../controllers/clientEnquery.controller.js";

const router = express.Router();



router.post("/create-enquery", createNewQuery);

router.get("/get-all-enquery", getAllEnquery);

router.post("/assign-vendor-to-enquery", assignVendorToEnquiry);

router.post("/delete-vendor-from-enquery", deleteVendorAssignment);

router.post("/add-new-followups", addNewFollowups);

router.post("/respondToFollowUps",respondToFollowUps)

router.get("/get-all-salespersonData", getAllSalesPersonData);

router.get("/get-specific-enquery-data/:enqueryId", getSpecificEnqueryData);

export default router;

