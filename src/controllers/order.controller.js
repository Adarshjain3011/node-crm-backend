import responseHandler from "../utils/responseHandler.js"

import { Quote, Order, Notification, Client } from "../config/models.js";

import { quote_status, user_role, vendor_delivery_status } from "../utils/data.js";

import { checkUserExists } from "../utils/helper.js";

// create new order 

const createNewOrder = async ({ quoteId, clientId, userId }) => {


    try {

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

        // Create notification for new order creation
        if (userId) {
            try {
                const userExists = await checkUserExists(userId);
                if (userExists) {
                    const title = "New Order Created";
                    const message = `A new order has been created for ${quote.clientId?.name || 'Client'} with total value ₹${quote.totalAmount} by ${userExists.name}.`;

                    await Notification.create({
                        title: title,
                        message: message,
                        recipientId: userId,
                    });
                }
            } catch (notificationError) {
                console.log("Notification error:", notificationError);
            }
        }

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

        // Create notification for order status update
        try {
            const title = "Order Status Updated";
            const message = `Order status has been updated to "${status}" by ${existingUser.name}.${remarks ? ` Remarks: ${remarks}` : ''}`;

            // Notify admin or relevant users
            await Notification.create({
                title: title,
                message: message,
                recipientId: existingUser._id,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

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

        let query = {};

        if (existingUser.role !== user_role.admin) {
            
            const userClients = await Client.find({
                $or: [
                    { createdBy: id },
                    { assignedTo: id }
                ]
            }).select('_id');

            const clientIds = userClients.map(client => client._id);

            query = { clientId: { $in: clientIds } };
        }

        const orders = await Order.find(query)
            .populate({
                path: 'clientId',
                populate: { path: 'assignedTo' }
            })
            .populate('invoiceId')
            .populate('finalQuotationId')
            .sort({ createdAt: -1 });


        return responseHandler(res, 200, true, "Orders fetched successfully", orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        return responseHandler(res, 500, false, "Error fetching orders", null, error.message);
    }
};



// Update vendor assignment status
const updateVendorAssignmentStatus = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { orderId, vendorId, status, remarks } = req.body;

        if (!orderId || !vendorId || !status) {
            return responseHandler(res, 400, false, "Order ID, Vendor ID, and status are required");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return responseHandler(res, 404, false, "Order not found");
        }

        // Find and update the vendor assignment
        const vendorAssignment = order.vendorAssignments.find(
            va => va.vendorId.toString() === vendorId
        );

        if (!vendorAssignment) {
            return responseHandler(res, 404, false, "Vendor assignment not found");
        }

        vendorAssignment.status = status;
        if (remarks) {
            vendorAssignment.remarks = remarks;
        }
        vendorAssignment.updatedAt = new Date();

        await order.save();

        // Create notification for vendor assignment status update
        try {
            const title = "Vendor Assignment Status Updated";
            const message = `Vendor assignment status has been updated to "${status}" by ${existingUser.name}.${remarks ? ` Remarks: ${remarks}` : ''}`;

            // Notify admin or relevant users
            await Notification.create({
                title: title,
                message: message,
                recipientId: existingUser._id,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Vendor assignment status updated successfully", order);

    } catch (error) {
        console.error("Error updating vendor assignment status:", error);
        return responseHandler(res, 500, false, "Error updating vendor assignment status", null, error.message);
    }
};

// Update order delivery details
const updateOrderDeliveryDetails = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { orderId, deliveryDate, deliveryAddress, deliveryNotes, trackingNumber } = req.body;

        if (!orderId) {
            return responseHandler(res, 400, false, "Order ID is required");
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return responseHandler(res, 404, false, "Order not found");
        }

        // Update delivery details
        if (deliveryDate) order.deliveryDate = deliveryDate;
        if (deliveryAddress) order.deliveryAddress = deliveryAddress;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        
        if (deliveryNotes) {
            order.deliverySummary.push({
                remarks: deliveryNotes,
                deliveredOn: new Date()
            });
        }

        order.updatedAt = new Date();
        await order.save();

        // Create notification for delivery details update
        try {
            const title = "Order Delivery Details Updated";
            const message = `Delivery details for order have been updated by ${existingUser.name}.${deliveryNotes ? ` Notes: ${deliveryNotes}` : ''}`;

            // Notify admin or relevant users
            await Notification.create({
                title: title,
                message: message,
                recipientId: existingUser._id,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Order delivery details updated successfully", order);

    } catch (error) {
        console.error("Error updating order delivery details:", error);
        return responseHandler(res, 500, false, "Error updating order delivery details", null, error.message);
    }
};

export {
    createNewOrder,
    getOrderDetails,
    updateOrderStatus,
    getAllOrders,
    updateVendorAssignmentStatus,
    updateOrderDeliveryDetails
};



