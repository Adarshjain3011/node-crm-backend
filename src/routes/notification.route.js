
import express from "express";

import {getAllNotification } from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { user_role } from "../utils/data.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = express.Router();

// router.post("/create-notification",createNewNotification);

router.get("/get-all-notification",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllNotification);

export default router;

