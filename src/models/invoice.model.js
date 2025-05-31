import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  // clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  // orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

  clientId:{

    type:String,

  },

  orderId:{


    type:String,


  },

  // Invoice Details
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceDate: { type: Date, default: Date.now },
  // dueDate: { type: Date, required: true },
  dueDate: { type: Date},
  buyerWorkOrderDate: { type: Date },

  invoiceLink: { type: String }, // URL to the invoice document

  // Buyer Info
  buyerName: { type: String, required: true },
  buyerAddress: { type: String, required: true },
  buyerGSTIN: { type: String, required: true },

  shippingAddress: { type: String, required: true },

  // Legal & Tax Info
  panNo: { type: String, required: true },
  stateCode: { type: String, required: true },
  stateName: { type: String, required: true },

  // Transport Info
  vehicleNo: { type: String, required: true },
  transporterName: { type: String, required: true },
  // transporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transporter' },
  transporterId: { type: String },
  ewayBillNumber: { type: String },

  // Items
  items: [
    {
      description: { type: String, required: true },
      hsn: { type: String, required: true },
      unit: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      amount: { type: Number, required: true } // qty * rate
    }
  ],

  // Charges
  transportCharges: { type: Number, default: 0 },
  installationCharges: { type: Number, default: 0 },

  // Totals
  taxableAmount: { type: Number, required: true },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  gstAmount: { type: Number, required: true }, // CGST + SGST or IGST
  totalAmount: { type: Number, required: true },

  // Payment
  paymentTerms: { type: String },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  notes: { type: String },

  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});


const Invoice =  mongoose.model("Invoice", invoiceSchema);

export default Invoice;

