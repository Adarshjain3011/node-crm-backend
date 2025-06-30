import responseHandler from "../utils/responseHandler.js";
import {Client, User, Notification, Order, Invoice, Quote } from "../config/models.js";
import { checkUserExists } from "../utils/helper.js";

import { user_role } from "../utils/data.js";

// create new enquery 

const createNewQuery = async (req, res) => {
    try {

        const { id } = req.user;

        if (!id) {

            return responseHandler(res, 401, false, "User is not authorized", null);

        }

        const userExists = await checkUserExists(id);

        if (!userExists) {

            return responseHandler(res, 400, false, "User not found", null);

        }

        const {
            name,
            companyName, // optional 
            phone,
            email, // optional 
            address, // optional 
            requirement,
            sourceWebsite, // optional 
            sourcePlatform // optional 
        } = req.body;

        if (!name || !phone) {

            return res
                .status(400)
                .json({ success: false, message: "Please fill all the fields" });
        }

        const newQuery = new Client({

            name: name,
            companyName: companyName || "",
            phone: phone,
            email: email || "",
            address: address || "",
            requirement: requirement || "",
            sourceWebsite: sourceWebsite || "",
            sourcePlatform: sourcePlatform || "",
            createdBy: userExists._id,

        });


        // Save the query to DB
        await newQuery.save();

        try {
            // Prepare meaningful notification
            const title = "New Client Inquiry Received";
            const message = `A new inquiry has been submitted by ${name} from ${companyName} regarding "${requirement}".`;

            // You can pass recipientId and createdBy dynamically based on your auth system
            await Notification.create({

                title: title,
                message: message,
                recipientId: userExists._id,

            })

        } catch (error) {
            console.log("Notification error:", error);
            return responseHandler(
                res,
                400,
                false,
                "Error occurred while creating the notification",
                null,
                error
            );
        }

        return responseHandler(res, 201, true, "Query created successfully", newQuery);

    } catch (error) {

        console.log("Query error:", error);
        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
};



// get all enquery 

const getAllEnquery = async (req, res) => {
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
            query = {
                $or: [
                    { createdBy: existingUser._id },
                    { assignedTo: existingUser._id }
                ]
            };
        }

        const allEnquiries = await Client.find(query)
            .populate("assignedTo", "name")
            .populate("assignedBy", "name")
            .populate("followUps.noteAddByUser", "name")
            .populate({
                path: "followUps.responses",
                populate: {
                    path: "respondedBy",
                    select: "name"
                }
            })
            .populate("createdBy", "name")
            .sort({ createdAt: -1 });

        return responseHandler(res, 200, true, "Enquiries fetched successfully", allEnquiries);

    } catch (error) {
        console.log("error is ", error);
        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
};





// assign vendor to the enquery 

const assignVendorToEnquiry = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, vendorId, deliveryEstimate, deliveryStatus, productDescription, estimatedCost, advancePaid, quantity } = req.body;

        if (!enqueryId || !vendorId) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");
        }

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) return responseHandler(res, 400, false, "enquery id is required")

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return responseHandler(res, 400, false, "vendor id is required")

        const alreadyExists = enquiry.vendorAssignments.find(
            (va) => va.vendorId.toString() === vendorId
        );

        if (alreadyExists) {

            return responseHandler(res, 400, false, "Vendor already assigned");
        }

        const newProduct = {};

        if (productDescription) newProduct.productDescription = productDescription;
        if (estimatedCost) newProduct.estimatedCost = estimatedCost;
        if (advancePaid) newProduct.advancePaid = advancePaid;
        if (deliveryEstimate) newProduct.deliveryEstimate = deliveryEstimate;
        if (deliveryStatus) newProduct.deliveryStatus = deliveryStatus;

        enquiry.vendorAssignments.push({
            vendorId,
            deliveryEstimate,
            deliveryStatus: deliveryStatus || 'Pending',
            products: Object.values(newProduct).length > 0 ? [newProduct] : []
        });

        await enquiry.save();

        // Create notification for vendor assignment
        try {
            const title = "Vendor Assigned to Inquiry";
            const message = `Vendor ${vendor.name} has been assigned to inquiry from ${enquiry.name} (${enquiry.companyName}).`;

            await Notification.create({
                title: title,
                message: message,
                recipientId: enquiry.assignedTo || existingUser._id,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Vendor assigned successfully", enquiry);

    } catch (err) {
        console.error(err);
        return responseHandler(res, 500, false, "Something went wrong", null, err);

    }
};





// handle delete vendor assignment

const deleteVendorAssignment = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, vendorId } = req.body;

        if (!enqueryId || !vendorId) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");
        }

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) return responseHandler(res, 400, false, "enquery id is required")

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return responseHandler(res, 400, false, "vendor id is required")

        const alreadyExists = enquiry.vendorAssignments.find(
            (va) => va.vendorId.toString() === vendorId
        );

        if (!alreadyExists) {

            return responseHandler(res, 400, false, "vendor id does not exists in the enquery");

        }

        // if exists then remove it from the enquery vendor assignment

        enquiry.vendorAssignments = enquiry.vendorAssignments.filter(
            (va) => va.vendorId.toString() !== vendorId
        );

        await enquiry.save();

        // Create notification for vendor removal
        try {
            const title = "Vendor Removed from Inquiry";
            const message = `Vendor ${vendor.name} has been removed from inquiry ${enquiry.name} (${enquiry.companyName}) by ${existingUser.name}.`;

            // Notify the assigned sales person or admin
            const recipientId = enquiry.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Vendor removed successfully", enquiry);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
}


// add new product to the assigned vendor


const addProductToVendorAssignment = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, vendorId, deliveryEstimate, deliveryStatus, productDescription, estimatedCost, advancePaid } = req.body;

        if (!enqueryId || !vendorId || !productDescription) {

            return responseHandler(res, 400, false, "Enquiry ID, Vendor ID and Product Description are required");
        }

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) return responseHandler(res, 400, false, "enquery id is required")

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return responseHandler(res, 400, false, "vendor id is required")

        const alreadyExists = enquiry.vendorAssignments.find(
            (va) => va.vendorId.toString() === vendorId
        );

        if (!alreadyExists) {

            return responseHandler(res, 400, false, "first you should assign the vendor to the enquery");

        }

        const newProduct = {};

        if (productDescription) newProduct.productDescription = productDescription;
        if (estimatedCost) newProduct.estimatedCost = estimatedCost;
        if (advancePaid) newProduct.advancePaid = advancePaid;
        if (deliveryEstimate) newProduct.deliveryEstimate = deliveryEstimate;
        if (deliveryStatus) newProduct.deliveryStatus = deliveryStatus;

        alreadyExists.products.push(newProduct);

        await enquiry.save();

        // Create notification for new product addition
        try {
            const title = "New Product Added to Vendor";
            const message = `A new product "${productDescription}" has been added to vendor ${vendor.name} for inquiry from ${enquiry.name} (${enquiry.companyName}) by ${existingUser.name}.`;

            // Notify the assigned sales person or admin
            const recipientId = enquiry.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Product assign to the  vendor successfully", enquiry);


    } catch (error) {

        console.log(error);

        return responseHandler(res, 500, false, "Something went wrong", null, error)
    }
}



// update the vendor assignment 

const updateVendorAssignment = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, vendorId, deliveryEstimate, deliveryStatus, productDescription, estimatedCost, advancePaid } = req.body;

        if (!enqueryId || !vendorId) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");

        }

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) return responseHandler(res, 400, false, "enquery id is required")

        const vendor = await Vendor.findById(vendorId);
        if (!vendor) return responseHandler(res, 400, false, "vendor id is required")

        const alreadyExists = enquiry.vendorAssignments.find(
            (va) => va.vendorId.toString() === vendorId
        );

        if (!alreadyExists) {

            return responseHandler(res, 400, false, "this vendor is not assign to this enquery ");

        }

        // i update the product on the basis  of vendor id

        const isProductExists = alreadyExists.products.find(
            (data) => data.productName.toLowerCase().trim() === productDescription.toLowerCase().trim()
        );

        if (!isProductExists) {

            return responseHandler(res, 400, false, "no product name match this product  description ");

        }



        // we have to update  the product 

        if (deliveryEstimate) alreadyExists.deliveryEstimate = deliveryEstimate;
        if (deliveryStatus) alreadyExists.deliveryStatus = deliveryStatus;
        if (productDescription) alreadyExists.productDescription = productDescription;
        if (estimatedCost) alreadyExists.estimatedCost = estimatedCost;
        if (advancePaid) alreadyExists.advancePaid = advancePaid;


        await enquiry.save();

        // Create notification for vendor assignment update
        try {
            const title = "Vendor Assignment Updated";
            const message = `Vendor assignment details for ${vendor.name} on inquiry from ${enquiry.name} (${enquiry.companyName}) have been updated by ${existingUser.name}.`;

            // Notify the assigned sales person or admin
            const recipientId = enquiry.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Vendor assignment updated successfully", enquiry);


    } catch (error) {

        console.log(error);

        return responseHandler(res, 500, false, "error occur while updating the vendor assignment ", enquiry);

    }
}





// add follow up note by admin ---->

const addNewFollowups = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, followUpDate, followUpNote } = req.body;

        if (![enqueryId, followUpDate, followUpNote].every(Boolean)) {
            return responseHandler(res, 400, false, "enqueryId, followUpDate, and followUpNote are required");
        }

        const enquiry = await Client.findById(enqueryId).select("followUps");
        if (!enquiry) {
            return responseHandler(res, 400, false, "Enquiry not found");
        }

        enquiry.followUps.push({
            followUpDate,
            followUpNote,
            noteAddByUser: existingUser._id,
        });

        await enquiry.save();

        // Populate the latest follow-up with user details
        await enquiry.populate({
            path: "followUps.noteAddByUser",
            select: "name"
        });

        const lastFollowUp = enquiry.followUps[enquiry.followUps.length - 1];

        // Create notification
        try {
            const title = "New Follow-up Added";
            const message = `A new follow-up has been added to inquiry from ${enquiry.name} (${enquiry.companyName}) by ${existingUser.name}.`;

            const recipientId = enquiry.assignedTo || existingUser._id;

            await Notification.create({
                title,
                message,
                recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Follow up added successfully", lastFollowUp);

    } catch (error) {
        console.log("Error is ", error);
        return responseHandler(res, 500, false, "Error occurred while adding new follow-up", error);
    }
};





// add respond to the notes by sales user

const respondToFollowUps = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);
        }


        const { message, enqueryId, followUpId } = req.body;

        // console.log("all required fileds are ", message, respondedBy, enqueryId, followUpId)

        if (!message || !enqueryId || !followUpId) {

            return responseHandler(res, 400, false, "All fields are required", null);

        }

        const client = await Client.findById(enqueryId);
        if (!client) {
            return responseHandler(res, 400, false, "Enquiry not found", null);
        }

        // Find the followUp by followUpId

        const followUp = client.followUps.id(followUpId);
        if (!followUp) {
            return responseHandler(res, 400, false, "Follow-up not found", null);
        }

        // Push the response
        followUp.responses.push({

            message,
            respondedBy: existingUser._id,

        });

        await client.save();

        // Create notification for follow-up response
        try {
            const title = "Follow-up Response Added";
            const message = `A response has been added to follow-up for inquiry from ${client.name} (${client.companyName}) by ${existingUser.name}.`;

            // Notify the user who created the follow-up
            const recipientId = followUp.noteAddByUser || client.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        const populatedFollowUpData = await Client.findById(enqueryId).populate("assignedTo", "name")
            .populate("assignedBy", "name")
            .populate("followUps.noteAddByUser", "name") // ✅ Populating the user who added the note
            .populate({
                path: "followUps.responses.respondedBy",
                select: "name",
            })

        console.log("populated follow up data  with response ", populatedFollowUpData);

        let filteredFollowUps = populatedFollowUpData.followUps.id(followUpId);

        if (!filteredFollowUps) {

            return responseHandler(res, 400, false, "Follow-up not found", null);

        }

        console.log("filtered followups response ", filteredFollowUps.responses[filteredFollowUps.responses.length - 1]);

        return responseHandler(res, 200, true, "Response added successfully", filteredFollowUps.responses[filteredFollowUps.responses.length - 1]);


    } catch (error) {
        console.log("Error is", error);
        return responseHandler(res, 500, false, "Internal Server Error");
    }
};





//update follow up status 


const updateFollowUpStatus = async (req, res) => {
    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 404, false, "User not found", null);
        }

        const { enqueryId, followUpId, status } = req.body;

        if (!enqueryId || !followUpId || typeof status === "undefined") {
            return responseHandler(res, 400, false, "enqueryId, followUpId, and status are required", null);
        }

        const enquiry = await Client.findById(enqueryId).select("followUps");

        if (!enquiry) {

            return responseHandler(res, 404, false, "Enquiry not found", null);

        }

        const followUp = enquiry.followUps.id(followUpId);

        if (!followUp) {

            return responseHandler(res, 404, false, "Follow-up not found", null);

        }

        followUp.done = status;

        await enquiry.save();

        // Create notification for follow-up status update
        try {
            const statusText = status ? "completed" : "reopened";
            const title = "Follow-up Status Updated";
            const message = `Follow-up for inquiry from ${enquiry.name} (${enquiry.companyName}) has been marked as ${statusText} by ${existingUser.name}.`;

            // Notify the user who created the follow-up
            const recipientId = followUp.noteAddByUser || enquiry.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "Follow-up status updated successfully");

    } catch (error) {
        console.error("Error updating follow-up status:", error);
        return responseHandler(res, 500, false, "An error occurred while updating follow-up status", null, error);
    }
};



const getSpecificEnqueryData = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);
        }


        const { enqueryId } = req.params;

        if (!enqueryId) {

            return responseHandler(res, 400, false, "enquery id is required");

        }

        const specificEnquery = await Client.findById(enqueryId)
            .populate("assignedTo", "name")
            .populate("assignedBy", "name")
            .populate("followUps.noteAddByUser", "name") // ✅ Populating the user who added the note
            .populate({
                path: "followUps.responses.respondedBy",
                select: "name",
            })

        if (!specificEnquery) {

            return responseHandler(res, 404, false, "enquery not found", null, null);

        }

        return responseHandler(res, 200, true, "Specific enquery fetched successfully", specificEnquery, null);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "error occur while fetch the specific enquery data", null, error);

    }
}



const fetchAllEnqueryAssignedToSpecificSalesPerson = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);
        }


        const { salesPersonId } = req.params;

        if (!salesPersonId) {

            return responseHandler(res, 400, false, "sales person id is required");

        }

        const specificEnquery = await Client.find({ assignedTo: salesPersonId })
            .populate("assignedTo", "name")
            .populate("assignedBy", "name")
            .populate("followUps.noteAddByUser", "name") // ✅ Populating the user who added the note
            .populate({});



    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "error occur while fetch the specific enquery data", null, error);

    }
}



const updateEnqueryRequirement = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);

        if (!existingUser) {

            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, updatedRequirement } = req.body;

        if (!enqueryId || !updatedRequirement) {

            return responseHandler(res, 400, false, "all fields are required ");

        }

        // check first enqueryId is exists 

        const isEnqueryExists = await Client.findById(enqueryId);

        if (!isEnqueryExists) {

            return responseHandler(res, 400, false, "no enquery find with this enquery Id ");

        }

        // now update enquery requirement 

        isEnqueryExists.requirement = updatedRequirement;

        await isEnqueryExists.save();

        // Create notification for requirement update
        try {
            const title = "Inquiry Requirement Updated";
            const message = `The requirement for inquiry from ${isEnqueryExists.name} (${isEnqueryExists.companyName}) has been updated by ${existingUser.name}.`;

            // Notify the assigned sales person or admin
            const recipientId = isEnqueryExists.assignedTo || existingUser._id;

            await Notification.create({
                title: title,
                message: message,
                recipientId: recipientId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }

        return responseHandler(res, 200, true, "requirement Updated successfully ", isEnqueryExists);


    } catch (error) {

        console.log("error: ", error);

        return responseHandler(res, 500, false, "error occur while updating enquery requirement", null);

    }
}

// assign sales person to inquiry

const assignSalesPersonToInquiry = async (req, res) => {

    console.log("assign sales person to enquery ke andar : ");

    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, salesPersonId } = req.body;

        if (!enqueryId || !salesPersonId) {
            return responseHandler(res, 400, false, "Enquiry ID and Sales Person ID are required");
        }

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) {
            return responseHandler(res, 404, false, "Inquiry not found");
        }

        const salesPerson = await User.findById(salesPersonId);
        if (!salesPerson) {
            return responseHandler(res, 404, false, "Sales person not found");
        }

        // Only admin or the user who created the enquiry can assign a salesperson
        if (
            existingUser.role !== user_role.admin &&
            enquiry.createdBy.toString() !== existingUser._id.toString()
        ) {
            return responseHandler(res, 403, false, "User is not authorized to assign salesperson");
        }

        // Check if salesperson is already assigned
        const isAlreadyAssigned = enquiry.assignedTo.some(
            (assignedId) => assignedId.toString() === salesPerson._id.toString()
        );

        if (isAlreadyAssigned) {
            return responseHandler(res, 400, false, "Sales person is already assigned to this enquiry");
        }

        // Update the assignment

        console.log("enquiry before updation", enquiry);

        enquiry.assignedTo.push(salesPersonId);
        enquiry.assignedBy = existingUser._id;
        enquiry.assignmentDate = new Date();
        enquiry.status = "Assigned";

        await enquiry.save();

        console.log("enquery after updation ", enquiry);

        // Optional: Create notification (uncomment if needed)
        /*
        try {
            const title = "Inquiry Assigned to You";
            const message = `You have been assigned to inquiry from ${enquiry.name} (${enquiry.companyName}) by ${existingUser.name}.`;

            await Notification.create({
                title,
                message,
                recipientId: salesPersonId,
            });
        } catch (notificationError) {
            console.log("Notification error:", notificationError);
        }
        */

        // Return essential response data
        return responseHandler(res, 200, true, "Sales person assigned successfully", {
            enquiryId: enquiry._id,
            assignedTo: enquiry.assignedTo,
            assignedBy: enquiry.assignedBy,
            status: enquiry.status,
            assignmentDate: enquiry.assignmentDate,
        });

    } catch (error) {
        console.error("Error assigning sales person:", error);
        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
};





// remove sales person from enquery ---->

const removeSalesPersonFromEnquery = async (req, res) => {

    try {

        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId, salesPersonId } = req.body;

        if (!enqueryId || !salesPersonId) {

            return responseHandler(res, 400, false, "Enquiry ID and Sales Person ID are required");

        }

        const enquiry = await Client.findById(enqueryId);


        if (!enquiry) {
            return responseHandler(res, 404, false, "Enquiry not found");
        }

        const salesPerson = await User.findById(salesPersonId);


        if (!salesPerson) {
            return responseHandler(res, 404, false, "Sales person not found");
        }

        // only admin or the sales user can remove the assined salesperson who created the enquery 

        console.log("existing user role ", existingUser.role);

        console.log("enquiry created by user id ", existingUser._id);

        console.log("enquiry created by : ", enquiry.createdBy);

        if (existingUser.role != user_role.admin && String(enquiry.createdBy) != String(existingUser._id)) {

            return responseHandler(res, 400, false, "user is not authorized to remove assigned person ");

        }

        // Check and remove the salesperson if they are assigned

        const isAssigned = enquiry.assignedTo.some(

            (assignedId) => assignedId.toString() === salesPerson._id.toString()

        );

        if (!isAssigned) {
            return responseHandler(res, 400, false, "Sales person is not assigned to this enquiry");
        }

        enquiry.assignedTo = enquiry.assignedTo.filter(
            (assignedId) => assignedId.toString() !== salesPerson._id.toString()
        );

        await enquiry.save();

        return responseHandler(res, 200, true, "Assigned sales person removed successfully");

    } catch (error) {
        console.error("Error while removing assigned sales person:", error);
        return responseHandler(res, 500, false, "An error occurred while removing the assigned sales person");
    }
};



// update the enquery details 

const updateEnqueryDetails = async (req, res) => {

    try {
        const { id } = req.user;

        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const {
            name,
            companyName,
            email,
            phone,
            sourceWebsite,
            sourcePlatform,
            clientId,
            requirement,
            productLink,
        } = req.body;

        if (!clientId) {
            return responseHandler(res, 400, false, "clientId is required");
        }

        const client = await Client.findById(clientId);
        if (!client) {
            return responseHandler(res, 404, false, "Client does not exist");
        }

        const changesField = {

            name,
            companyName,
            email,
            phone,
            sourceWebsite,
            sourcePlatform,
            clientId,
            requirement,
            productLink,
        };

        // if (name) changesField.name = name;
        // if (companyName) changesField.companyName = companyName;
        // if (email) changesField.email = email;
        // if (phone) changesField.phone = phone;
        // if (sourceWebsite) changesField.sourceWebsite = sourceWebsite;

        // // ⚠️ Bug Fix: You were assigning sourceWebsite to sourcePlatform
        // if (sourcePlatform) changesField.sourcePlatform = sourcePlatform;

        // if (productLink) changesField.productLink = productLink;
        // if (requirement) changesField.requirement = requirement;

        // if (Object.keys(changesField).length === 0) {
        //     return responseHandler(res, 200, true, "No changes made");
        // }

        const updatedClient = await Client.findByIdAndUpdate(clientId, changesField, { new: true });

        return responseHandler(res, 200, true, "Fields updated successfully", updatedClient);
    } catch (error) {
        console.error("Error updating enquiry details:", error);
        return responseHandler(res, 500, false, "Error occurred while updating enquiry details", null, error);
    }
};


// delete specific enquery 

const deleteSpecificEnquery = async (req, res) => {
    try {
        const { id } = req.user;
        if (!id) {
            return responseHandler(res, 401, false, "User is not authorized", null);
        }

        const existingUser = await checkUserExists(id);
        if (!existingUser) {
            return responseHandler(res, 400, false, "User not found", null);
        }

        const { enqueryId } = req.params;

        console.log("enqueryId", enqueryId);

        if (!enqueryId) {
            return responseHandler(res, 400, false, "Enquiry ID is required");
        }

        const enquery = await Client.findById(enqueryId);
        if (!enquery) {
            return responseHandler(res, 404, false, "Enquiry does not exist");
        }

        // Delete related Invoice(s), Order(s), Quotation(s)
        const clientObjectId = enquery._id;
        const deletedInvoice = await Invoice.deleteMany({ clientId: clientObjectId });
        const deletedOrder = await Order.deleteMany({ clientId: clientObjectId });
        const deletedQuotation = await Quote.deleteMany({ clientId: clientObjectId });

        // Delete the Enquiry
        const deletedEnquiry = await Client.findByIdAndDelete(clientObjectId);

        // ──────── 🔔 Send Notification ────────
        try {
            const title = "Enquiry Deleted";
            const message = `You've deleted the enquiry from ${enquery.companyName} ("${enquery.requirement}").`;

            await Notification({
                title,
                message,
                recipientId: existingUser._id, // or change to enquery.assignedTo, adminId, etc.
                createdBy: existingUser._id,
            });
        } catch (notifErr) {
            console.error("Notification error:", notifErr);
            // we don't block the response if notifying fails
        }
        // ─────────────────────────────────────

        return responseHandler(
            res,
            200,
            true,
            "Enquiry and related records deleted successfully",
            {
                deletedInvoiceCount: deletedInvoice.deletedCount,
                deletedOrderCount: deletedOrder.deletedCount,
                deletedQuotationCount: deletedQuotation.deletedCount,
            }
        );
    } catch (error) {
        console.error("Error while deleting enquiry:", error);
        return responseHandler(res, 500, false, "Error occurred while deleting the enquiry", null, error);
    }
};




export {

    createNewQuery,
    updateVendorAssignment,
    addNewFollowups,
    getAllEnquery,
    assignVendorToEnquiry,
    deleteVendorAssignment,
    respondToFollowUps,
    getSpecificEnqueryData,
    updateFollowUpStatus,
    updateEnqueryRequirement,
    assignSalesPersonToInquiry,
    updateEnqueryDetails,
    deleteSpecificEnquery,
    removeSalesPersonFromEnquery,

}



