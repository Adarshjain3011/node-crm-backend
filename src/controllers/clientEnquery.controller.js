import responseHandler from "../utils/responseHandler.js";

import Vendor from "../models/vendor.model.js";

import Client from "../models/clientEnquery.model.js"

import User from "../models/user.model.js";

import { checkUserExists } from "../utils/helper.js";

// create new enquery 

const createNewQuery = async (req, res) => {

    try {

        const { name, companyName, phone, email, address, requirement, sourceWebsite, sourcePlatform } = req.body;

        console.log("all required fileds are ", name, companyName, phone, email, address, requirement, sourceWebsite, sourcePlatform);

        if (!name || !companyName || !phone || !email || !address || !requirement || !sourceWebsite || !sourcePlatform) {

            return res.status(400).json({ success: false, message: "Please fill all the fields" });

        }

        // hdio

        const newQuery = new Client({
            name,
            companyName,
            phone,
            email,
            address,
            requirement,
            sourceWebsite,
            sourcePlatform
        });

        await newQuery.save();

        return responseHandler(res, 201, true, "Query created successfully", newQuery);

    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);

    }
}




// get all enquery 

const getAllEnquery = async (req, res) => {

    const { id } = req.user;

    if (!id) {
        return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const existingUser = await checkUserExists(id);
    if (!existingUser) {
        return responseHandler(res, 400, false, "User not found", null);
    }

    try {

        const { id } = req.user;

        if (!id) {

            return responseHandler(res, 400, false, "user is not authorised ", null);
        }

        let isuserExists;

        try {

            isuserExists = await checkUserExists(id);

        } catch (error) {

            console.log("error is : ", error);

            return responseHandler(res, 400, false, "Something went wrong", null, error);

        }

        const allEnquery = await Client.find()
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
            .sort({ createdAt: -1 });

        return responseHandler(res, 200, true, "Enquery fetched successfully", allEnquery);

    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
}





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
            products: values(newProduct).length > 0 ? [newProduct] : []
        });

        await enquiry.save();
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

        const enquiry = await ClientEnquery.findById(enqueryId);
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
        return responseHandler(res, 200, true, "Vendor removed successfully", enquiry);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "Something went wrong", null, error);
    }
}


// add new product to the assigned vendor


const addProductToVendorAssignment = async (req, res) => {

    try {

        const { enqueryId, vendorId, deliveryEstimate, deliveryStatus, productDescription, estimatedCost, advancePaid } = req.body;

        if (!enqueryId || !vendorId || !productName) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");
        }

        const enquiry = await ClientEnquery.findById(enqueryId);
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
        return responseHandler(res, 200, true, "Product assign to the  vendor successfully", enquiry);


    } catch (error) {

        console.log(error);

        return responseHandler(res, 500, false, "Something went wrong", null, err)
    }
}



// update the vendor assignment 

const updateVendorAssignment = async (req, res) => {

    try {

        const { enqueryId, vendorId, deliveryEstimate, deliveryStatus, productDescription, estimatedCost, advancePaid } = req.body;

        if (!enqueryId || !vendorId || !productName) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");

        }


        if (!enqueryId || !vendorId) {

            return responseHandler(res, 400, false, "Enquiry ID and Vendor ID are required");
        }

        const enquiry = await ClientEnquery.findById(enqueryId);
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

        // although we can get this by 

        const { enqueryId, followUpDate, followUpNote } = req.body;

        console.log("all required fileds are ", enqueryId, followUpDate, followUpNote)

        if (!enqueryId || !followUpDate || !followUpNote) {

            return responseHandler(res, 400, false, "enquery id and followUpDate and followUpNote are required");

        }

        const enquiry = await Client.findById(enqueryId);

        if (!enquiry) return responseHandler(res, 400, false, "enquery id is required");

        enquiry.followUps.push({

            followUpDate,
            followUpNote,
            noteAddByUser: existingUser._id,

        });

        await enquiry.save();
        return responseHandler(res, 200, true, "Follow up added successfully", enquiry);


    } catch (error) {

        console.log("error is ", error);

        return responseHandler(res, 500, false, "error occur while adding new follow up ", error);

    }
}




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

        const enquiry = await Client.findById(enqueryId);
        if (!enquiry) {
            return responseHandler(res, 404, false, "Enquiry not found", null);
        }

        const followUp = enquiry.followUps.id(followUpId);
        if (!followUp) {
            return responseHandler(res, 404, false, "Follow-up not found", null);
        }

        followUp.done = status;

        await enquiry.save();

        return responseHandler(res, 200, true, "Follow-up status updated successfully", enquiry);

    } catch (error) {
        console.error("Error updating follow-up status:", error);
        return responseHandler(res, 500, false, "An error occurred while updating follow-up status", null, error);
    }
};





// delete specific follow ups 

const deleteSpecificFollowUp = async (req, res) => {

    try {



    } catch (error) {

        console.log("error is ", error);

    }
}


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




export {

    createNewQuery,
    updateVendorAssignment,
    addNewFollowups,
    getAllEnquery,
    assignVendorToEnquiry,
    deleteVendorAssignment,
    respondToFollowUps,
    getSpecificEnqueryData,
    updateFollowUpStatus

}

