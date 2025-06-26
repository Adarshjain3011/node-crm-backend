
import express from "express";

import {

    createNewQuery,
    getAllEnquery,
    assignVendorToEnquiry,
    deleteVendorAssignment,
    addNewFollowups,
    // getAllSalesPersonData,
    respondToFollowUps,
    getSpecificEnqueryData,
    updateFollowUpStatus,
    updateEnqueryRequirement,
    updateEnqueryDetails,
    deleteSpecificEnquery,
    removeSalesPersonFromEnquery,
    assignSalesPersonToInquiry


} from "../controllers/clientEnquery.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { user_role } from "../utils/data.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();


// it can be created by anyone 

router.post("/create-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),createNewQuery);

router.get("/get-all-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllEnquery);

router.post("/assign-vendor-to-enquery", authMiddleware,authorizeRoles(user_role.admin,user_role.sales),assignVendorToEnquiry);

router.post("/delete-vendor-from-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),deleteVendorAssignment);

router.post("/add-new-followups", authMiddleware,authorizeRoles(user_role.admin,user_role.sales),addNewFollowups);

router.post("/respondToFollowUps",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),respondToFollowUps)


router.get("/get-specific-enquery-data/:enqueryId",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getSpecificEnqueryData);


router.post("/update-follow-up-status",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateFollowUpStatus);

router.post("/update-enquery-requirement",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateEnqueryRequirement)

router.post("/update-enquery-details",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateEnqueryDetails);

router.get("/deleteSpecificEnquery/:enqueryId",authMiddleware,authorizeRoles(user_role.admin),deleteSpecificEnquery);

router.post("/assign-person-to-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),assignSalesPersonToInquiry)

router.post("/removeSalesPersonFromEnquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),removeSalesPersonFromEnquery);

export default router;




