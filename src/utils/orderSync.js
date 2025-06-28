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
        order.documents = quoteData.image && Array.isArray(quoteData.image) ? quoteData.image : [];

        // Update vendor assignments based on quote items
        const vendorAssignments = [];
        console.log("Processing quote items for vendor assignments:", quoteData.items.length);
        
        quoteData.items.forEach((item, itemIndex) => {
            console.log(`Item ${itemIndex}:`, item.description, "Vendors:", item.vendors?.length || 0);
            if (item.vendors && Array.isArray(item.vendors)) {
                item.vendors.forEach((vendor, vendorIndex) => {
                    const advanceValue = vendor.advance === "N/A" ? 0 : (vendor.advance || 0);
                    const orderValue = (vendor.quantity || 0) * (vendor.costPerUnit || 0);
                    
                    console.log(`Vendor ${vendorIndex}:`, {
                        vendorId: vendor.vendorId,
                        description: vendor.description,
                        quantity: vendor.quantity,
                        costPerUnit: vendor.costPerUnit,
                        advance: vendor.advance,
                        advanceValue: advanceValue,
                        orderValue: orderValue
                    });
                    
                    vendorAssignments.push({
                        vendorId: vendor.vendorId,
                        itemRef: vendor.description || item.description,
                        assignedQty: vendor.quantity || 0,
                        orderValue: orderValue,
                        advancePaid: advanceValue,
                        finalPayment: orderValue - advanceValue,
                        deliveryEstimate: vendor.deliveryDate,
                        status: vendor.vendordeliveryStatus,
                    });
                });
            }
        });

        console.log("Final vendor assignments:", vendorAssignments.length);
        order.vendorAssignments = vendorAssignments;
        order.updatedAt = new Date();

        await order.save();
        return order;
    } catch (error) {
        console.error("Error syncing order with quote:", error);
        throw error;
    }
}; 


