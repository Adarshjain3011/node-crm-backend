import Order from "../models/order.model.js";
import { quote_status } from "./data.js";

/**
 * Updates an existing order with new quote data
 * @param {string} quoteId - The ID of the quote
 * @param {Object} quoteData - The updated quote data
 */
export const syncOrderWithQuote = async (quoteId, quoteData) => {
    try {

        console.log("Syncing order with quote:", quoteId, quoteData);

        // Find the associated order
        const order = await Order.findOne({ finalQuotationId: quoteId });
        
        if (!order) {
            console.log(`No order found for quote ${quoteId}`);
            return null;
        }

        // Update order details
        order.orderValue = quoteData.totalAmount;
        order.transport = quoteData.transport || 0;
        order.installation = quoteData.installation || 0;
        order.gstAmount = quoteData.gstPercent || 0;
        order.totalPayable = quoteData.totalAmount;
        order.documents = quoteData.image ? [quoteData.image] : [];

        // Update vendor assignments based on quote items
        const vendorAssignments = [];
        quoteData.items.forEach((item) => {
            item.vendors.forEach((vendor) => {
                vendorAssignments.push({
                    vendorId: vendor.vendorId,
                    itemRef: item.description,
                    assignedQty: vendor.quantity,
                    orderValue: vendor.quantity * vendor.costPerUnit,
                    advancePaid: vendor.advance,
                    finalPayment: (vendor.quantity * vendor.costPerUnit) - vendor.advance,
                    deliveryEstimate: vendor.deliveryDate,
                    status: vendor.vendordeliveryStatus,
                });
            });
        });

        order.vendorAssignments = vendorAssignments;
        order.updatedAt = new Date();

        await order.save();
        return order;
    } catch (error) {
        console.error("Error syncing order with quote:", error);
        throw error;
    }
}; 


