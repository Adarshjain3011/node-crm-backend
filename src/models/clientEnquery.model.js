import mongoose from "mongoose";

import { enquery_status } from "../utils/data.js";

// Main client schema
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyName: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  requirement: { type: String },
  sourceWebsite: { type: String },
  sourcePlatform: { type: String },

  productLink :{

    type: String,

  },
  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdBy :{

    type: mongoose.Schema.Types.ObjectId, ref: 'User',

  },

  assignmentDate: { type: Date, default: Date.now },

  // Status
  status: {
    type: String,
    enum: Object.values(enquery_status),
    default: enquery_status.Unassigned,
  },


  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  quoteValue: { type: Number },
  finalQuoteApproved: { type: Number },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  quoteSubmitted: { type: Boolean, default: false },

  // Communication Notes
  communicationNotes: [
    {
      note: String,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }
  ],

  // Follow-ups
  followUps: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      followUpDate: Date,
      noteAddByUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      followUpNote: String,
      done: { type: Boolean, default: false },
      responses: [
        {
          message: String,
          respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          respondedAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],


  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

clientSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default clientSchema;


