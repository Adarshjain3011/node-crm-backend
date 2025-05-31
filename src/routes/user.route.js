
import express from "express";

import { createUser,getAllSalesPerson,assignPersonToEnquery,getAllMembersData, updateMembersData } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/create-user",createUser);

router.get("/get-all-sales-person",getAllSalesPerson);

router.post("/assign-person-to-enquery",assignPersonToEnquery);

router.get("/get-all-members-data",getAllMembersData);

router.post("/update-members-data",updateMembersData);

export default router;

