
import express from "express";

import { createUser,getAllMembersData, updateMembersData,deleteUser, uploadUserList,resetPassword,updateUserImage } from "../controllers/user.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import { user_role } from "../utils/data.js";


const router = express.Router();

router.post("/create-user",authMiddleware,authorizeRoles(user_role.admin),createUser);

// router.post("/assign-person-to-enquery",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),assignPersonToEnquery);

router.get("/get-all-members-data",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllMembersData);

router.post("/update-members-data",authMiddleware,authorizeRoles(user_role.admin),updateMembersData);

router.post("/delete-user",authMiddleware,authorizeRoles(user_role.admin),deleteUser);

router.post("/upload-user-list",uploadUserList);

router.post("/reset-password",authMiddleware,resetPassword);

router.post("/updateUserImage",authMiddleware,updateUserImage);


export default router;

