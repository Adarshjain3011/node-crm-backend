import responseHandler from "../utils/responseHandler.js";
import uploadImage from "../utils/upload.js";
import { quote_status } from "../utils/data.js";
import { Order, Client, Quote } from "../config/models.js";
import { createNewOrder } from "./order.controller.js";
import { syncOrderWithQuote } from "../utils/orderSync.js";
import { checkUserExists } from "../utils/helper.js";

// create an new quote for the specific enquery 

const createNewQuote = async (req, res) => {
  try {

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const existingUser = await checkUserExists(id);

    if (!existingUser) {

      return responseHandler(res, 400, false, "User not found", null);
      
    }

    const rawData = req.body?.data;

    console.log("req ke body data is ", req.body);

    if (!rawData) {
      return responseHandler(res, 400, false, null, "Missing quote data in request.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(rawData);
    } catch (err) {
      return responseHandler(res, 400, false, null, "Invalid JSON format in quote data.");
    }

    const {
      clientId,
      items,
      taxPercent = 0,
      transport = 0,
      installation = 0,
      totalAmount,
      reason,
      notes,
      image,
    } = parsedData;

    console.log("image is ", req.files?.image);

    let imageFilePath = req.files?.image;

    // console.log("inside body image is ",req.body?.image);

    if (!clientId) {

      return responseHandler(res, 400, false, null, "Client ID is required");
    }

    if (!clientId || !items || items.length === 0) {
      return responseHandler(res, 400, false, null, "Client ID and at least one quote item are required.");
    }

    // Check if client exists
    const clientExists = await Client.findById(clientId);
    if (!clientExists) {
      return responseHandler(res, 404, false, null, "Client not found.");
    }

    // upload image to the cloudinary 

    let uploadedImageUrl = "";

    if (imageFilePath) {

      try {

        const result = await uploadImage(imageFilePath.tempFilePath);

        uploadedImageUrl = result;

      } catch (error) {

        console.log("image url is ", uploadedImageUrl);

        return responseHandler(res, 400, false, "error occur while uplaodin the image ", null, error);

      }

    }


    console.log("uploaded image url ", uploadedImageUrl);

    // Get latest quote version for the client
    const existingQuotes = await Quote.find({ clientId });
    const version = existingQuotes.length + 1;

    // Compute subtotal for each item and full quote total
    let grossSubtotal = 0;

    const processedItems = items.map(item => {
      const itemSubtotal = item.quantity * item.finalUnitPrice;
      grossSubtotal += itemSubtotal;

      return {
        ...item,
        subtotal: itemSubtotal,
      };
    });

    // Calculate tax
    const taxAmount = (grossSubtotal * taxPercent) / 100;

    const finalTotal = totalAmount || (grossSubtotal + taxAmount + Number(transport) + Number(installation));

    const newQuote = new Quote({
      clientId,
      version,
      items: processedItems,
      taxPercent,
      transport,
      installation,
      totalAmount: finalTotal,
      reason: version > 1 ? reason : undefined,
      notes,
      image: uploadedImageUrl.secure_url || "",
      createdBy: req.user?._id || null, // assuming auth middleware
      status: 'Draft'
    });

    await newQuote.save();

    return responseHandler(res, 200, true, "Quote created successfully.", newQuote);
  } catch (error) {
    console.error("Quote creation error:", error);
    return responseHandler(res, 500, false, "some went wrong", null, error.message);
  }
};


// get the all the quote revisions for the specific enquery

const getAllQuoteRevisions = async (req, res) => {

  try {

    const { enqueryId } = req.params;

    if (!enqueryId) {

      return responseHandler(res, 400, false, "enquery id is required");

    }

    const quotes = await Quote.find({ clientId: enqueryId }).populate("clientId");

    return responseHandler(res, 200, true, "quotes fetched successfully", quotes);


  } catch (error) {

    console.log("error is :", error);

    return responseHandler(res, 500, false, "error occur while fetch the quotes", null, error);

  }
}

// Helper function to check if quote needs order sync
const shouldSyncOrder = (quote) => {
  return quote.status.toLowerCase() === quote_status.APPROVED.toLowerCase();
};

// Helper function to handle order sync
const handleOrderSync = async (quote) => {
  if (shouldSyncOrder(quote)) {
    try {
      const updatedOrder = await syncOrderWithQuote(quote._id, quote);
      return updatedOrder;
    } catch (error) {
      console.error("Error syncing order:", error);
      return null;
    }
  }
  return null;
};



const updateRootFieldsAndItemAddDeleteAndUpdate = async (req, res) => {
  try {
    const { rootFieldChanges, itemChanges, quoteId } = req.body;

    console.log("Request body for update:", {
      rootFieldChanges,
      itemChanges,
      quoteId,
      files: req.files
    });

    if (!quoteId) {
      return responseHandler(res, 400, false, "Quote ID is required.");
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return responseHandler(res, 404, false, "Quote not found.");
    }

    const originalStatus = quote.status;

    // Handle image upload if present
    let uploadedImageUrl = "";
    const imageFile = Array.isArray(req.files?.image) ? req.files.image[0] : req.files?.image;
    if (imageFile) {
      try {
        const result = await uploadImage(imageFile.tempFilePath);
        uploadedImageUrl = result.secure_url || "";
        quote.image = uploadedImageUrl;
      } catch (error) {
        console.error("Image upload error:", error);
        return responseHandler(res, 400, false, "Error uploading image.", null, error.message);
      }
    }

    // Update root fields
    if (rootFieldChanges) {
      Object.keys(rootFieldChanges).forEach(field => {
        if (field !== 'status' && field !== 'image') { // Handle status and image separately
          if (rootFieldChanges[field] !== undefined) {
            quote[field] = rootFieldChanges[field];
          }
        }
      });
    }

    // Process item changes
    if (Array.isArray(itemChanges)) {
      // Validate items before making changes
      const validItems = itemChanges.every(itemData => {
        if (itemData.type === "added") {
          return itemData.data && itemData.data.description; // Basic validation for new items
        } else if (itemData.type === "modified") {
          return itemData.index !== undefined && itemData.changes;
        } else if (itemData.type === "removed") {
          return itemData.index !== undefined;
        }
        return false;
      });

      if (!validItems) {
        return responseHandler(res, 400, false, "Invalid item changes format");
      }

      // Apply changes if validation passed
      itemChanges.forEach((itemData) => {
        try {
          if (itemData.type === "added" && itemData.data) {
            quote.items.push({
              ...itemData.data,
              subtotal: (itemData.data.quantity || 0) * (itemData.data.finalUnitPrice || 0)
            });
          } else if (itemData.type === "modified" && itemData.index !== undefined && itemData.changes) {
            const specificItem = quote.items[itemData.index];
            if (specificItem) {
              Object.assign(specificItem, itemData.changes);
              // Recalculate subtotal if quantity or price changed
              if (itemData.changes.quantity || itemData.changes.finalUnitPrice) {
                specificItem.subtotal = (specificItem.quantity || 0) * (specificItem.finalUnitPrice || 0);
              }
            }
          } else if (itemData.type === "removed" && itemData.index !== undefined) {
            if (itemData.index >= 0 && itemData.index < quote.items.length) {
              quote.items.splice(itemData.index, 1);
            }
          }
        } catch (error) {
          console.error("Error processing item change:", error, itemData);
        }
      });

      // Recalculate total amount
      let grossSubtotal = 0;
      quote.items.forEach(item => {
        grossSubtotal += item.subtotal || 0;
      });

      const taxAmount = ((grossSubtotal || 0) * (quote.taxPercent || 0)) / 100;
      quote.totalAmount = (grossSubtotal || 0) + (taxAmount || 0) + (quote.transport || 0) + (quote.installation || 0);
    }

    // Handle status change if present
    if (rootFieldChanges && rootFieldChanges.status) {
      const newStatus = rootFieldChanges.status;

      if (originalStatus !== newStatus) {
        if (newStatus.toLowerCase() === quote_status.APPROVED.toLowerCase()) {
          // Creating new order
          try {
            const order = await createNewOrder({
              quoteId: quote._id,
              clientId: quote.clientId
            });
            quote.status = newStatus;
            console.log("New order created:", order._id);
          } catch (error) {
            console.error("Error creating order:", error);
            return responseHandler(res, 400, false, "Error creating order: " + error.message);
          }
        } else if (originalStatus.toLowerCase() === quote_status.APPROVED.toLowerCase() &&
          newStatus.toLowerCase() === quote_status.DRAFT.toLowerCase()) {
          // Remove associated order when changing to draft
          console.log("Removing order for quote:", quote._id);
          await Order.deleteMany({ finalQuotationId: quote._id });
          quote.status = newStatus;
        } else {
          quote.status = newStatus;
        }
      }
    }

    // Save the updated quote
    await quote.save();

    // Sync with order if the quote is approved
    let updatedOrder = null;
    if (quote.status.toLowerCase() === quote_status.APPROVED.toLowerCase()) {
      try {
        updatedOrder = await syncOrderWithQuote(quote._id, quote);
      } catch (syncError) {
        console.error("Error syncing order:", syncError);
        // Continue with quote update even if order sync fails
      }
    }

    const response = {
      quote,
      ...(updatedOrder && { order: updatedOrder })
    };

    return responseHandler(
      res,
      200,
      true,
      updatedOrder ? "Quote and order updated successfully." : "Quote updated successfully.",
      response
    );

  } catch (error) {
    console.error("Error updating quote:", error);
    return responseHandler(res, 500, false, "Error updating quote.", null, error.message);
  }
};


// update quotes status 

const updateQuoteStatus = async (req, res) => {
  try {
    const { quoteId, status } = req.body;

    if (!quoteId || !status) {
      return responseHandler(res, 400, false, "Quote ID and status are required.");
    }

    if (!Object.values(quote_status).includes(status)) {
      return responseHandler(res, 400, false, "Invalid status provided.");
    }

    const quote = await Quote.findById(quoteId);

    if (!quote) {
      return responseHandler(res, 404, false, "Quote not found.");
    }

    if (status.toLowerCase() === quote_status.APPROVED.toLowerCase() && quote.status.toLowerCase() !== quote_status.APPROVED.toLowerCase()) {

      const preparedData = {
        clientId: quote.clientId,
        quoteVersion: quote.version,
        quoteId: quote._id,
        transport: quote.transport,
        installation: quote.installation,
        gstAmount: quote.gstPercent,
        totalPayable: quote.totalAmount,
        documents: quote.image,
      };

      const result = await createNewOrder({

        quoteId: quote._id,
        clientId: quote.clientId,

      });


      console.log("Order created:", result);

    }

    // If changing from Finalized to something else, remove the order
    if (quote.status.toLowerCase() === quote_status.APPROVED.toLowerCase() && status.toLowerCase() == quote_status.DRAFT.toLowerCase()) {

      console.log("Removing order for quote:", quote);


      await Order.findOneAndDelete({ finalQuotationId: quote._id });


    }

    // Update quote status and timestamp
    quote.status = status;
    quote.updatedAt = new Date();
    await quote.save();

    return responseHandler(res, 200, true, "Quote status updated successfully.", quote);

  } catch (error) {
    console.error("Error updating quote status:", error);
    return responseHandler(res, 500, false, "Error updating quote status.", null, error.message);
  }
};



// add new vendor to the quotes 


const addNewVendorToQuote = async (req, res) => {
  try {
    const { quoteId, itemIndex, vendorData } = req.body;

    console.log("Request body for adding vendor:", vendorData);

    if (!quoteId || itemIndex === undefined || !vendorData || !vendorData.vendorId) {
      return responseHandler(res, 400, false, "Quote ID, itemIndex, and vendor data (with vendorId) are required.");
    }

    const quote = await Quote.findById(quoteId);
    if (!quote) {
      return responseHandler(res, 404, false, "Quote not found.");
    }

    const item = quote.items[itemIndex];
    if (!item) {
      return responseHandler(res, 400, false, "Invalid item index.");
    }

    // Validate vendor data
    if (!vendorData.quantity || !vendorData.costPerUnit) {
      return responseHandler(res, 400, false, "Vendor quantity and cost per unit are required.");
    }

    const vendorExists = item.vendors.some(
      (v) => v.vendorId.toString() === vendorData.vendorId
    );

    if (vendorExists) {
      const vendorToUpdate = item.vendors.find(
        (v) => v.vendorId.toString() === vendorData.vendorId
      );
      if (vendorToUpdate) {
        Object.assign(vendorToUpdate, vendorData);
      }
    } else {
      item.vendors.push(vendorData);
    }

    await quote.save();

    // Sync with order if needed
    const updatedOrder = await handleOrderSync(quote);

    return responseHandler(
      res,
      200,
      true,
      updatedOrder ? "Quote and vendor assignments updated successfully." : "Quote vendor assignments updated successfully.",
      updatedOrder ? { quote, order: updatedOrder } : quote
    );

  } catch (error) {
    console.error("Error managing vendor in quote:", error);
    return responseHandler(res, 500, false, "Error managing vendor in quote.", null, error.message);
  }
};



// remove vendor at the quotes 

const removeVendorAtQuotes = async (req, res) => {

  try {

    const { quoteId, itemIndex, vendorId } = req.body;

    if (!quoteId || itemIndex === undefined) {
      return responseHandler(res, 400, false, "Quote ID, itemIndex, and vendor data (with vendorId) are required.");
    }

    const quote = await Quote.findById(quoteId);

    if (!quote) {
      return responseHandler(res, 404, false, "Quote not found.");
    }

    if (!quote.items[itemIndex]) {
      return responseHandler(res, 400, false, "Invalid item index.");
    }


    let item = quote.items[itemIndex];

    // Remove vendor by ID

    const initialLength = item.vendors.length;


    item.vendors = item.vendors.filter((vendor) => vendor.vendorId.toString() !== vendorId);

    if (item.vendors.length === initialLength) {

      return responseHandler(res, 404, false, "Vendor not found in item.");

    }

    await quote.save();

    return responseHandler(res, 200, true, "Vendor removed from quote item successfully.", quote);


  } catch (error) {

    console.log("error is : ", error);

    return responseHandler(res, 500, false, "vendor remove successfully",)
  }
}

// update the specific quote item details

const updateQuoteItemDetails = async (req, res) => {

  try {
    const { quoteId, itemIndex, updatedItemData } = req.body;

    if (!quoteId || itemIndex === undefined || !updatedItemData) {
      return responseHandler(res, 400, false, "Quote ID, itemIndex, and updatedItemData are required.");
    }

    const quote = await Quote.findById(quoteId);

    if (!quote) {
      return responseHandler(res, 404, false, "Quote not found.");
    }

    const specificItem = quote.items[itemIndex];

    if (!specificItem) {
      return responseHandler(res, 400, false, "Invalid item index.");
    }

    // Update only fields that are different
    const fieldsToUpdate = ["description", "hsn", "unit", "quantity", "finalUnitPrice", "subtotal"];

    fieldsToUpdate.forEach((field) => {
      if (updatedItemData[field] !== undefined && updatedItemData[field] !== specificItem[field]) {
        specificItem[field] = updatedItemData[field];
      }
    });

    // Update the timestamp
    quote.updatedAt = new Date();

    await quote.save();

    return responseHandler(res, 200, true, "Quote item updated successfully.", quote);
  } catch (error) {
    console.error("Error updating quote item:", error);
    return responseHandler(res, 500, false, "Error updating quote item.", null, error.message);
  }
};



export {

  createNewQuote,
  getAllQuoteRevisions,
  addNewVendorToQuote,
  removeVendorAtQuotes,
  updateQuoteItemDetails,
  updateRootFieldsAndItemAddDeleteAndUpdate,
  updateQuoteStatus

}




