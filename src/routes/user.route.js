
import express from "express";

import { createUser,assignPersonToEnquery,getAllMembersData, updateMembersData } from "../controllers/user.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import { user_role } from "../utils/data.js";

const router = express.Router();

router.post("/create-user",authMiddleware,authorizeRoles(user_role.admin));

router.post("/assign-person-to-enquery",authMiddleware,authorizeRoles(user_role.admin),assignPersonToEnquery);

router.get("/get-all-members-data",getAllMembersData,authMiddleware,authorizeRoles(user_role.admin,user_role.sales));

router.post("/update-members-data",authMiddleware,authorizeRoles(user_role.admin),updateMembersData);

export default router;

