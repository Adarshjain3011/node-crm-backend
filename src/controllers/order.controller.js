import responseHandler from "../utils/responseHandler.js"

import Quote from "../models/quote.model.js";
import Order from "../models/order.model.js";
import { quote_status, user_role, vendor_delivery_status } from "../utils/data.js";

import { checkUserExists } from "../utils/helper.js";

// create new order 

const createNewOrder = async ({ quoteId, clientId }) => {


    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);

        }

        // Validate input
        if (!quoteId || !clientId) {
            throw new Error("Quote ID and Client ID are required");
        }

        // Check if order already exists for this quote then delete it and create new one 


        const existingOrder = await Order.deleteMany({ finalQuotationId: quoteId });

        console.log("deleted Existing Order is : ", existingOrder);

        // if (existingOrder) {
        //     throw new Error("Order already exists for this quote");
        // }

        // Fetch the quote
        const quote = await Quote.findById(quoteId).populate('clientId');
        if (!quote) {
            throw new Error("Quote not found");
        }

        // Build vendor assignments from quote items
        const vendorAssignments = [];
        quote.items.forEach((item) => {
            if (item.vendors && item.vendors.length > 0) {
                item.vendors.forEach((vendor) => {
                    vendorAssignments.push({
                        vendorId: vendor.vendorId,
                        itemRef: item.description,
                        assignedQty: vendor.quantity || 0,
                        orderValue: (vendor.quantity || 0) * (vendor.costPerUnit || 0),
                        advancePaid: vendor.advance || 0,
                        finalPayment: ((vendor.quantity || 0) * (vendor.costPerUnit || 0)) - (vendor.advance || 0),
                        deliveryEstimate: vendor.deliveryDate,
                        status: vendor.vendordeliveryStatus || vendor_delivery_status.Pending,
                    });
                });
            }
        });

        // Create the order
        const newOrder = new Order({
            clientId,
            quoteVersion: quote.version,
            orderValue: quote.totalAmount,
            transport: quote.transport || 0,
            finalQuotationId: quote._id,
            installation: quote.installation || 0,
            gstAmount: quote.gstPercent || 0,
            totalPayable: quote.totalAmount,
            vendorAssignments,
            documents: quote.image ? [quote.image] : [],
            deliveryStatus: 'Pending',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const savedOrder = await newOrder.save();

        // Update quote with order reference
        quote.orderId = savedOrder._id;
        await quote.save();

        return savedOrder;
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};



// Get order details

const getOrderDetails = async (req, res) => {
    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);

        }

        const { orderId } = req.params;

        if (!orderId) {
            return responseHandler(res, 400, false, "Order ID is required");
        }

        const order = await Order.findById(orderId)
            .populate('clientId')
            .populate('finalQuotationId')
            .populate('vendorAssignments.vendorId');

        if (!order) {
            return responseHandler(res, 404, false, "Order not found");
        }

        return responseHandler(res, 200, true, "Order details fetched successfully", order);
    } catch (error) {
        console.error("Error fetching order details:", error);
        return responseHandler(res, 500, false, "Error fetching order details", null, error.message);
    }
};



// Update order status

const updateOrderStatus = async (req, res) => {


    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);

        }

        const { orderId, status, remarks } = req.body;

        if (!orderId || !status) {
            return responseHandler(res, 400, false, "Order ID and status are required");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return responseHandler(res, 404, false, "Order not found");
        }

        order.deliveryStatus = status;
        if (remarks) {
            order.deliverySummary.push({
                remarks,
                deliveredOn: new Date()
            });
        }
        order.updatedAt = new Date();

        await order.save();
        return responseHandler(res, 200, true, "Order status updated successfully", order);
    } catch (error) {
        console.error("Error updating order status:", error);
        return responseHandler(res, 500, false, "Error updating order status", null, error.message);
    }
};



// Get all orders

const getAllOrders = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        let orders;

        if (existingUser.role === user_role.admin) {
            // Admin gets all orders
            orders = await Order.find()
                .populate({
                    path: 'clientId',
                    populate: { path: 'assignedTo' }
                })
                .populate('invoiceId')
                .populate('finalQuotationId')
                .sort({ createdAt: -1 });
        } else {
            // For other users, filter orders where clientId.assignedTo === current user
            orders = await Order.find()
                .populate({
                    path: 'clientId',
                    populate: { path: 'assignedTo' }
                })
                .populate('invoiceId')
                .populate('finalQuotationId')
                .sort({ createdAt: -1 });

            // Filter in JS after populating
            orders = orders.filter(order =>
                order.clientId?.assignedTo?._id?.toString() === id
            );
        }

        return responseHandler(res, 200, true, "Orders fetched successfully", orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return responseHandler(res, 500, false, "Error fetching orders", null, error.message);
    }
};


export {
    createNewOrder,
    getOrderDetails,
    updateOrderStatus,
    getAllOrders
};

