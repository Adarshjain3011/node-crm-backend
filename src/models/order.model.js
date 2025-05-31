import mongoose from "mongoose";

import Quote from "./quote.model.js";
import { vendor_delivery_status } from "../utils/data.js";

const vendorAssignmentSchema = new mongoose.Schema({
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    itemRef: String,
    assignedQty: Number,
    orderValue: Number,
    advancePaid: Number,
    finalPayment: Number,
    deliveryEstimate: Date,
    deliveryActual: Date,
    status: { type: String, enum: Object.values(vendor_delivery_status), default: vendor_delivery_status.Pending },
    comments: String
});



const orderSchema = new mongoose.Schema({
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    quoteVersion: Number,
    orderValue: Number,
    transport: Number,
    installation: Number,
    gstAmount: Number,
    totalPayable: Number,
    finalQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
    vendorAssignments: [vendorAssignmentSchema],
    documents: [String],  // URLs of delivery proofs, receipts etc.
    deliveryStatus: {
        type: String,
        enum: ['Pending', 'In Production', 'Packing', 'Shipped', 'Delivered'],
        default: 'Pending'
    },
    deliverySummary: [
        {
            vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
            deliveredOn: Date,
            remarks: String
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});


const Order = mongoose.model('Order', orderSchema);

export default Order;