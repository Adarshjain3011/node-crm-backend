import { Order, Invoice, Client, Notification } from "../config/models.js";

import { checkUserExists } from '../utils/helper.js';
import responseHandler from '../utils/responseHandler.js';

import uploadImage from '../utils/upload.js';

import mongoose from "mongoose";

// import puppeteer from "puppeteer";

// Create a new invoice

const createNewInvoice = async (req, res) => {
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
      orderId,
      clientId,
      buyerName,
      buyerAddress,
      buyerGSTIN,
      invoiceNumber,
      panNo,
      stateCode,
      stateName,
      vehicleNo,
      transporterName,
      transporterId,
      ewayBillNumber,
      shippingAddress,
      buyerWorkOrderDate,
      items,
      transportCharges,
      installationCharges,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      gstAmount,
      totalAmount,
      paymentTerms,
      notes,
    } = req.body;

    if (
      !buyerName || !buyerAddress || !buyerGSTIN ||
      !invoiceNumber || !items || items.length === 0 ||
      !clientId || !orderId
    ) {
      return responseHandler(res, 400, false, "Missing required fields", null);
    }

    // check first invoice Number should always be unique 

    const isInvoiceNumberUnique = await Invoice.findOne({

      invoiceNumber: invoiceNumber,

    });


    if (isInvoiceNumberUnique) {


      return responseHandler(res, 500, false, "invoice number should be unique");


    }

    const isOrderExists = await Order.findById(orderId);
    if (!isOrderExists) {
      return responseHandler(res, 400, false, "Order does not exist", null);
    }

    const isClientExists = await Client.findById(clientId);
    if (!isClientExists) {
      return responseHandler(res, 400, false, "Client does not exist", null);
    }

    // check before creating an invoice 

    const isInvoiceAlreadyExists = await Invoice.findOne({

      orderId: orderId,
      clientId: clientId,

    })

    console.log("isInvoiceAlreadyExists", isInvoiceAlreadyExists);

    if (isInvoiceAlreadyExists) {

      return responseHandler(res, 400, false, "this invoice is already exists duplicate not allowed", null);

    }

    const newInvoice = new Invoice({
      orderId,
      clientId,
      buyerName,
      buyerAddress,
      buyerGSTIN,
      invoiceNumber,
      panNo,
      stateCode,
      stateName,
      vehicleNo,
      transporterName,
      transporterId,
      ewayBillNumber,
      shippingAddress,
      buyerWorkOrderDate,
      items,
      transportCharges: transportCharges || 0,
      installationCharges: installationCharges || 0,
      taxableAmount,
      cgstAmount: cgstAmount || 0,
      sgstAmount: sgstAmount || 0,
      igstAmount: igstAmount || 0,
      gstAmount,
      createdBy: userExists._id,
      totalAmount,
      paymentTerms: paymentTerms || '',
      notes: notes || '',
    });

    await newInvoice.save();

    isOrderExists.invoiceId = newInvoice._id;

    await isOrderExists.save();

    // Create notification for new invoice creation
    try {
      const title = "New Invoice Created";
      const message = `A new invoice #${invoiceNumber} has been created for ${buyerName} with total amount ₹${totalAmount} by ${userExists.name}.`;

      // Notify admin or relevant users
      await Notification.create({
        title: title,
        message: message,
        recipientId: userExists._id,
      });
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
    }

    return responseHandler(res, 201, true, "Invoice created successfully", newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return responseHandler(res, 500, false, error.meessage, null, error);
  }
};



// Get invoice form data

const getInvoiceFormDetails = async (req, res) => {

  console.log("get invoice details ke andar at backend ")

  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { orderId, clientId } = req.body;

    if (!orderId || !clientId) {
      return responseHandler(res, 400, false, "All fields are required", null);
    }

    console.log("orderId and clientId is : ", orderId, clientId);

    const isOrderExists = await Order.findById(orderId);

    console.log("order data is : ", isOrderExists);

    if (!isOrderExists) {
      return responseHandler(res, 400, false, "Order does not exist", null);
    }

    const isClientExists = await Client.findById(clientId);
    if (!isClientExists) {
      return responseHandler(res, 400, false, "Client does not exist", null);
    }

    const invoiceFormData = await Invoice.findOne({ clientId, orderId });

    console.log("invoice form data is : ", invoiceFormData);

    if (invoiceFormData) {
      return responseHandler(res, 200, true, "Invoice form data fetched successfully", invoiceFormData);
    } else {
      return responseHandler(res, 400, true, "invoice data does not found", null);
    }
  } catch (error) {
    console.error("Error fetching invoice form data:", error);
    return responseHandler(res, 500, false, "Error fetching invoice form data", null, error);
  }
};



// Update invoice data

const updateInvoiceFormData = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { invoiceId, updates } = req.body;

    if (!invoiceId || !updates || typeof updates !== 'object') {
      return responseHandler(res, 400, false, "Invoice ID and updates are required", null);
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return responseHandler(res, 404, false, "Invoice not found", null);
    }

    Object.entries(updates).forEach(([key, value]) => {
      invoice[key] = value;
    });

    await invoice.save();

    // Create notification for invoice update
    try {
      const title = "Invoice Updated";
      const message = `Invoice #${invoice.invoiceNumber} for ${invoice.buyerName} has been updated by ${userExists.name}.`;

      // Notify admin or relevant users
      await Notification.create({
        title: title,
        message: message,
        recipientId: userExists._id,
      });
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
    }

    return responseHandler(res, 200, true, "Invoice updated successfully", invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return responseHandler(res, 500, false, "Internal server error", null, error);
  }
};



const deleteInvoiceForm = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { invoiceId } = req.params;

    console.log("invoice id is : ", invoiceId);

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return responseHandler(res, 400, false, "A valid Invoice ID is required", null);
    }

    const validInvoiceId = new mongoose.Types.ObjectId(invoiceId);

    // Check if invoice exists and delete it
    const isInvoiceExists = await Invoice.findByIdAndDelete(validInvoiceId);
    if (!isInvoiceExists) {
      return responseHandler(res, 404, false, "Invoice not found", null);
    }

    // Now update the corresponding order
    const isOrderExists = await Order.findById(isInvoiceExists.orderId);
    if (isOrderExists) {
      isOrderExists.invoiceId = undefined;
      await isOrderExists.save();
    }

    // Create notification for invoice deletion
    try {
      const title = "Invoice Deleted";
      const message = `Invoice #${isInvoiceExists.invoiceNumber} for ${isInvoiceExists.buyerName} has been deleted by ${userExists.name}.`;

      // Notify admin or relevant users
      await Notification.create({
        title: title,
        message: message,
        recipientId: userExists._id,
      });
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
    }

    return responseHandler(res, 200, true, "Invoice deleted successfully", isInvoiceExists);
  } catch (error) {
    console.error("error is : ", error);
    return responseHandler(res, 500, false, "Internal server error", null, error);
  }
};





const getAllInvoiceForm = async (req, res) => {

  try {

    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const allInvoiceForm = await Invoice.find({});

    if (allInvoiceForm.length === 0) {

      return responseHandler(res, 400, false, "no invoices found ", null);

    }

    return responseHandler(res, 200, true, "all invoice form data fetched successfully", allInvoiceForm);

  } catch (error) {

    console.log("error is : ", error);

    return responseHandler(res, 400, false, "error occur while fetching the invoice data ")

  }
}



import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// const uploadInvoiceExcelAndPdf = async (req, res) => {
//   let tempExcelPath = null;
//   let tempPdfPath = null;
//   let browser = null;

//   try {
//     const { id } = req.user;
//     if (!id) return responseHandler(res, 401, false, "User not authorized", null);

//     const userExists = await checkUserExists(id);
//     if (!userExists) return responseHandler(res, 400, false, "User not found", null);

//     const { invoiceId } = req.body;
//     if (!invoiceId) {
//       return responseHandler(res, 400, false, "invoiceId is required", null);
//     }

//     const isInvoiceExists = await Invoice.findById(invoiceId);
//     if (!isInvoiceExists) {
//       return responseHandler(res, 400, false, "Invoice does not exist", null);
//     }

//     const excelFile = req.files?.excelFile;
//     if (!excelFile) {
//       return responseHandler(res, 400, false, "Excel file is required", null);
//     }

//     // Ensure tmp directory exists
//     const tmpDir = path.join(__dirname, "../tmp");
//     if (!fs.existsSync(tmpDir)) {
//       fs.mkdirSync(tmpDir, { recursive: true });
//     }

//     // Save Excel temporarily with timestamp to avoid conflicts
//     const timestamp = Date.now();
//     tempExcelPath = path.join(tmpDir, `invoice-${invoiceId}-${timestamp}.xlsx`);
//     await excelFile.mv(tempExcelPath);

//     // Upload Excel to Cloudinary
//     const uploadedExcel = await uploadImage(tempExcelPath);
//     if (!uploadedExcel?.secure_url) {
//       throw new Error("Failed to upload Excel file to Cloudinary");
//     }
//     const excelUrl = uploadedExcel.secure_url;

//     // Read Excel and convert to HTML with improved formatting
//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.readFile(tempExcelPath);

//     // Try to get Sheet 2, fallback to first sheet if not found
//     const worksheet = workbook.getWorksheet(2) || workbook.getWorksheet(1);
//     if (!worksheet) {
//       throw new Error("No worksheet found in Excel file");
//     }

//     let html = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="UTF-8">
//         <style>
//           body { 
//             font-family: Arial, sans-serif; 
//             margin: 20px;
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//           }
//           table { 
//             border-collapse: collapse; 
//             width: 100%; 
//             margin-top: 20px;
//             page-break-inside: auto;
//           }
//           tr { 
//             page-break-inside: avoid; 
//             page-break-after: auto;
//           }
//           td, th { 
//             border: 1px solid #ddd; 
//             padding: 8px; 
//             font-size: 12px;
//             text-align: left;
//             overflow-wrap: break-word;
//             max-width: 200px;
//           }
//           th { 
//             background-color: #f8f9fa; 
//             font-weight: bold;
//           }
//           .header { 
//             margin-bottom: 20px;
//             text-align: center;
//           }
//           @page { 
//             margin: 20px;
//             size: A4;
//           }
//           @media print {
//             body { -webkit-print-color-adjust: exact !important; }
//             th { background-color: #f8f9fa !important; }
//           }
//         </style>
//       </head>
//       <body>
//         <div class="header">
//           <h2>Invoice #${isInvoiceExists.invoiceNumber || ''}</h2>
//           <p>Date: ${new Date().toLocaleDateString()}</p>
//         </div>
//         <table>
//     `;

//     // Calculate optimal column widths
//     const colWidths = [];
//     worksheet.columns.forEach(col => {
//       const maxLength = Math.max(
//         ...(col.values || []).filter(Boolean).map(v => 
//           String(v?.text || v?.result || v || '').length
//         ) || [10]
//       );
//       colWidths.push(Math.min(Math.max(maxLength * 7, 50), 200)); // min 50px, max 200px
//     });

//     // Add header row
//     html += '<tr>';
//     worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
//       let value = '';
//       try {
//         value = cell?.text || cell?.value || '';
//       } catch (err) {
//         console.warn(`Warning: Could not read header cell value at column ${colNumber}`, err);
//       }
//       html += `<th style="width: ${colWidths[colNumber-1]}px">${value}</th>`;
//     });
//     html += '</tr>';

//     // Add data rows with improved value handling
//     for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
//       const row = worksheet.getRow(rowNumber);
//       if (row.hasValues) {
//         html += '<tr>';
//         row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
//           let value = '';

//           try {
//             // Handle different cell types
//             if (!cell || cell.value === null || cell.value === undefined) {
//               value = '';
//             } else if (cell.type === ExcelJS.ValueType.RichText && cell.richText) {
//               value = cell.richText.map(rt => rt?.text || '').join('');
//             } else if (cell.type === ExcelJS.ValueType.Hyperlink && cell.value) {
//               value = cell.value.text || cell.value.address || '';
//             } else if (cell.type === ExcelJS.ValueType.Formula) {
//               value = (cell.result !== null && cell.result !== undefined) ? String(cell.result) : '';
//             } else if (cell.type === ExcelJS.ValueType.Date && cell.value) {
//               value = cell.value.toLocaleDateString() || '';
//             } else if (cell.type === ExcelJS.ValueType.Number && cell.value !== null) {
//               value = String(cell.value);
//             } else {
//               // Default handling for other types
//               value = (cell.text !== null && cell.text !== undefined) ? cell.text : 
//                      (cell.value !== null && cell.value !== undefined) ? String(cell.value) : '';
//             }
//           } catch (err) {
//             console.warn(`Warning: Could not read cell value at row ${rowNumber}, column ${colNumber}`, err);
//             value = '';
//           }

//           // Sanitize the value to prevent HTML injection
//           value = value.toString()
//             .replace(/&/g, '&amp;')
//             .replace(/</g, '&lt;')
//             .replace(/>/g, '&gt;')
//             .replace(/"/g, '&quot;')
//             .replace(/'/g, '&#039;');

//           html += `<td style="width: ${colWidths[colNumber-1]}px">${value}</td>`;
//         });
//         html += '</tr>';
//       } else {
//         // Add empty row with correct number of columns
//         html += '<tr>';
//         for (let i = 0; i < colWidths.length; i++) {
//           html += `<td style="width: ${colWidths[i]}px"></td>`;
//         }
//         html += '</tr>';
//       }
//     }

//     html += `</table></body></html>`;

//     // Convert HTML to PDF with improved Puppeteer configuration
//     tempPdfPath = path.join(tmpDir, `invoice-${invoiceId}-${timestamp}.pdf`);

//     // Launch browser with updated Puppeteer 24.x configuration
//     browser = await puppeteer.launch({
//       headless: "new",
//       args: [
//         '--no-sandbox',
//         '--disable-setuid-sandbox',
//         '--disable-dev-shm-usage',
//         '--font-render-hinting=none'
//       ]
//     });

//     const page = await browser.newPage();
//     await page.setViewport({ width: 1200, height: 800 });

//     // Set content with timeout and wait options
//     await page.setContent(html, { 
//       waitUntil: ['networkidle0', 'domcontentloaded'],
//       timeout: 30000
//     });

//     // Generate PDF with improved options
//     await page.pdf({
//       path: tempPdfPath,
//       format: 'A4',
//       printBackground: true,
//       preferCSSPageSize: true,
//       margin: {
//         top: '20px',
//         right: '20px',
//         bottom: '20px',
//         left: '20px'
//       },
//       displayHeaderFooter: true,
//       headerTemplate: '<div></div>',
//       footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> of <span class="totalPages"></span></div>'
//     });

//     // Upload PDF to Cloudinary
//     const uploadedPdf = await uploadImage(tempPdfPath);
//     if (!uploadedPdf?.secure_url) {
//       throw new Error("Failed to upload PDF file to Cloudinary");
//     }
//     const pdfUrl = uploadedPdf.secure_url;

//     // Update invoice record
//     isInvoiceExists.invoiceExcelLink = excelUrl;
//     isInvoiceExists.invoiceExcelPdfLink = pdfUrl;
//     await isInvoiceExists.save();

//     return responseHandler(res, 200, true, "Excel and PDF uploaded successfully", isInvoiceExists);

//   } catch (error) {
//     console.error("Error in uploadInvoiceExcelAndPdf:", error);
//     return responseHandler(
//       res, 
//       500, 
//       false, 
//       `Error uploading files: ${error.message}`, 
//       null, 
//       error
//     );
//   } finally {
//     // Cleanup resources
//     if (browser) {
//       try {
//         await browser.close();
//       } catch (err) {
//         console.error("Error closing browser:", err);
//       }
//     }

//     // Cleanup temporary files
//     if (tempExcelPath && fs.existsSync(tempExcelPath)) {
//       try {
//         fs.unlinkSync(tempExcelPath);
//       } catch (err) {
//         console.error("Error deleting temp Excel file:", err);
//       }
//     }
//     if (tempPdfPath && fs.existsSync(tempPdfPath)) {
//       try {
//         fs.unlinkSync(tempPdfPath);
//       } catch (err) {
//         console.error("Error deleting temp PDF file:", err);
//       }
//     }
//   }
// };


const uploadInvoiceExcelAndPdf = async (req, res) => {
  let tempFilePath = null;

  try {
    const { id } = req.user;
    if (!id) return responseHandler(res, 401, false, "User not authorized", null);

    const userExists = await checkUserExists(id);
    if (!userExists) return responseHandler(res, 400, false, "User not found", null);

    const { invoiceId } = req.body;
    if (!invoiceId) {
      return responseHandler(res, 400, false, "invoiceId is required", null);
    }

    const isInvoiceExists = await Invoice.findById(invoiceId);
    if (!isInvoiceExists) {
      return responseHandler(res, 400, false, "Invoice does not exist", null);
    }

    const uploadedFile = req.files?.file;
    if (!uploadedFile) {
      return responseHandler(res, 400, false, "File is required", null);
    }

    // Use /tmp on Vercel, local tmp otherwise
    const tmpDir = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // Save the file temporarily
    const timestamp = Date.now();
    const fileExt = path.extname(uploadedFile.name).toLowerCase(); // .xlsx, .xls or .pdf
    const baseName = `invoice-${invoiceId}-${timestamp}${fileExt}`;
    tempFilePath = path.join(tmpDir, baseName);
    await uploadedFile.mv(tempFilePath);

    // Only allow .xlsx, .xls, or .pdf files
    if (![".xlsx", ".xls", ".pdf"].includes(fileExt)) {
      return responseHandler(res, 400, false, "Only .xlsx, .xls or .pdf files are allowed", null);
    }

    // Upload file as-is to Cloudinary
    const uploadedFileCloud = await uploadImage(tempFilePath);
    if (!uploadedFileCloud?.secure_url) {
      throw new Error("Failed to upload file to Cloudinary");
    }

    // Update invoice based on file type
    if (fileExt === ".pdf") {
      isInvoiceExists.invoiceExcelPdfLink = uploadedFileCloud.secure_url;
      // isInvoiceExists.invoiceExcelLink = "";
    } else {
      // Excel file
      isInvoiceExists.invoiceExcelLink = uploadedFileCloud.secure_url;
      // isInvoiceExists.invoiceExcelPdfLink = "";
    }

    await isInvoiceExists.save();

    // Create notification for file upload
    try {
      const title = "Invoice File Uploaded";
      const message = `${fileExt.toUpperCase()} file has been uploaded for invoice #${isInvoiceExists.invoiceNumber} (${isInvoiceExists.buyerName}) by ${userExists.name}.`;

      // Notify admin or relevant users
      await Notification.create({
        title: title,
        message: message,
        recipientId: userExists._id,
      });
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
    }

    return responseHandler(res, 200, true, `${fileExt.toUpperCase()} file uploaded successfully`, isInvoiceExists);

  } catch (error) {
    console.error("Error in uploadInvoiceExcelAndPdf:", error);
    return responseHandler(
      res,
      500,
      false,
      `Error uploading files: ${error.message}`,
      null,
      error
    );
  } finally {
    // Cleanup
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (err) { }
    }
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return responseHandler(res, 401, false, "User is not authorized", null);
    }

    const userExists = await checkUserExists(id);
    if (!userExists) {
      return responseHandler(res, 400, false, "User not found", null);
    }

    const { invoiceId, status } = req.body;

    if (!invoiceId || !status) {
      return responseHandler(res, 400, false, "Invoice ID and status are required", null);
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return responseHandler(res, 404, false, "Invoice not found", null);
    }

    // Update the status
    invoice.status = status;
    await invoice.save();

    // Create notification for status update
    try {
      const title = "Invoice Status Updated";
      const message = `Invoice #${invoice.invoiceNumber} for ${invoice.buyerName} status has been updated to "${status}" by ${userExists.name}.`;

      // Notify admin or relevant users
      await Notification.create({
        title: title,
        message: message,
        recipientId: userExists._id,
      });
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
    }

    return responseHandler(res, 200, true, "Invoice status updated successfully", invoice);

  } catch (error) {
    console.error("Error updating invoice status:", error);
    return responseHandler(res, 500, false, "Internal server error", null, error);
  }
};

export {
  createNewInvoice,
  getInvoiceFormDetails,
  updateInvoiceFormData,
  uploadInvoiceExcelAndPdf,
  deleteInvoiceForm,
  getAllInvoiceForm,
  updateInvoiceStatus
};


