
import express from "express";

import { getAllOrders,getOrderDetails,updateOrderStatus } from "../controllers/order.controller.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/role.middleware.js";

import { user_role } from "../utils/data.js";

const router = express.Router();

// Define the routes for order management

router.get("/get-all-orders",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getAllOrders);

router.get("/get-order-details/:orderId",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),getOrderDetails);

router.post("/update-order-status",authMiddleware,authorizeRoles(user_role.admin,user_role.sales),updateOrderStatus);




export default router;

