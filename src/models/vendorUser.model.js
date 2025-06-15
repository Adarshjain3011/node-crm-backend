import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export default vendorSchema;

