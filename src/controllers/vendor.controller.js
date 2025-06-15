import responseHandler from "../utils/responseHandler.js";
import { Vendor, Client } from "../config/models.js";
import { checkUserExists } from "../utils/helper.js";

// Create a new vendor
const createVendor = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { name, companyName, email, phone, address, specialization, isActive } = req.body;

        if (!name || !companyName || !email || !phone || !address) {
            return responseHandler(res, 400, false, "Please fill all required fields");
        }

        const vendorExists = await Vendor.findOne({ email });
        if (vendorExists) {
            return responseHandler(res, 400, false, "Vendor with this email already exists");
        }

        const newVendor = await Vendor.create({
            name,
            companyName,
            email,
            phone,
            address,
            specialization,
            isActive: isActive ?? true
        });

        return responseHandler(res, 201, true, "Vendor created successfully", newVendor);
    } catch (error) {
        console.error("Error creating vendor:", error);
        return responseHandler(res, 500, false, "Internal server error", null, error);
    }
};

// Get all vendors
const getAllVendors = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const vendors = await Vendor.find()
            .populate({
                path: 'assignedEnquiries',
                select: 'name companyName requirement status'
            })
            .sort({ createdAt: -1 });

        return responseHandler(res, 200, true, "Vendors fetched successfully", vendors);
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return responseHandler(res, 500, false, "Internal server error", null, error);
    }
};

// Get vendor by ID
const getVendorById = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { vendorId } = req.params;
        if (!vendorId) {
            return responseHandler(res, 400, false, "Vendor ID is required");
        }

        const vendor = await Vendor.findById(vendorId)
            .populate({
                path: 'assignedEnquiries',
                select: 'name companyName requirement status'
            });

        if (!vendor) {
            return responseHandler(res, 404, false, "Vendor not found");
        }

        return responseHandler(res, 200, true, "Vendor fetched successfully", vendor);
    } catch (error) {
        console.error("Error fetching vendor:", error);
        return responseHandler(res, 500, false, "Internal server error", null, error);
    }
};

// Update vendor
const updateVendor = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { vendorId } = req.params;
        if (!vendorId) {
            return responseHandler(res, 400, false, "Vendor ID is required");
        }

        const { name, companyName, email, phone, address, specialization, isActive } = req.body;

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return responseHandler(res, 404, false, "Vendor not found");
        }

        // Check if email is being changed and if it's already in use
        if (email && email !== vendor.email) {
            const emailExists = await Vendor.findOne({ email });
            if (emailExists) {
                return responseHandler(res, 400, false, "Email already in use by another vendor");
            }
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(
            vendorId,
            {
                name: name || vendor.name,
                companyName: companyName || vendor.companyName,
                email: email || vendor.email,
                phone: phone || vendor.phone,
                address: address || vendor.address,
                specialization: specialization || vendor.specialization,
                isActive: isActive !== undefined ? isActive : vendor.isActive
            },
            { new: true }
        );

        return responseHandler(res, 200, true, "Vendor updated successfully", updatedVendor);
    } catch (error) {
        console.error("Error updating vendor:", error);
        return responseHandler(res, 500, false, "Internal server error", null, error);
    }
};

// Delete vendor
const deleteVendor = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { vendorId } = req.params;
        if (!vendorId) {
            return responseHandler(res, 400, false, "Vendor ID is required");
        }

        // Check if vendor has any assigned enquiries
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return responseHandler(res, 404, false, "Vendor not found");
        }

        if (vendor.assignedEnquiries && vendor.assignedEnquiries.length > 0) {
            return responseHandler(res, 400, false, "Cannot delete vendor with assigned enquiries");
        }

        await Vendor.findByIdAndDelete(vendorId);
        return responseHandler(res, 200, true, "Vendor deleted successfully");
    } catch (error) {
        console.error("Error deleting vendor:", error);
        return responseHandler(res, 500, false, "Internal server error", null, error);
    }
};

export {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor
};

