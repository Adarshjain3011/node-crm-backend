
import express from "express";

import { getAllOrders,getOrderDetails } from "../controllers/order.controller.js";

const router = express.Router();

// Define the routes for order management

router.get("/get-all-orders", getAllOrders);

router.get("/get-order-details/:orderId", getOrderDetails);

// router.post("/update-order-status", updateOrderStatus);


export default router;

