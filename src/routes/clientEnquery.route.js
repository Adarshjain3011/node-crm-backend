
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

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { user_role } from "../utils/data.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();



router.post("/create-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),createNewQuery);

router.get("/get-all-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllEnquery);

router.post("/assign-vendor-to-enquery", authMiddleware,authorizeRoles(user_role.admin,user_role.sales),assignVendorToEnquiry);

router.post("/delete-vendor-from-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),deleteVendorAssignment);

router.post("/add-new-followups", authMiddleware,authorizeRoles(user_role.admin,user_role.sales),addNewFollowups);

router.post("/respondToFollowUps",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),respondToFollowUps)

router.get("/get-all-salespersonData",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllSalesPersonData);

router.get("/get-specific-enquery-data/:enqueryId",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getSpecificEnqueryData);

export default router;

