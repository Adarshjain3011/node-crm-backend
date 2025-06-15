import mongoose from 'mongoose';

// Import schemas
import vendorSchema from '../models/vendorUser.model.js';
import clientSchema from '../models/clientEnquery.model.js';
import userSchema from '../models/user.model.js';
import quoteSchema from '../models/quote.model.js';
import orderSchema from '../models/order.model.js';
import invoiceSchema from '../models/invoice.model.js';

// Create models
const models = {
    Vendor: mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema),
    Client: mongoose.models.Client || mongoose.model('Client', clientSchema),
    User: mongoose.models.User || mongoose.model('User', userSchema),
    Quote: mongoose.models.Quote || mongoose.model('Quote', quoteSchema),
    Order: mongoose.models.Order || mongoose.model('Order', orderSchema),
    Invoice: mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema)
};

export const { Vendor, Client, User, Quote, Order, Invoice } = models; 

