// import responseHandler from '../utils/responseHandler.js';
// import Invoice from '../models/invoice.model.js';
// import ExcelJS from 'exceljs';
// import fs from 'fs';
// import path from 'path';
// import { convertExcelToPdf } from '../utils/convertExcelToPdf.js';
// import uploadImage from '../utils/upload.js';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// // Define __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const formatDate = (date) => {
//   if (!date) return '';
//   const d = new Date(date);
//   return d.toLocaleDateString('en-IN');
// };

// // Function to ensure directory exists
// const ensureDirectoryExists = (dirPath) => {
//   if (!fs.existsSync(dirPath)) {
//     fs.mkdirSync(dirPath, { recursive: true });
//   }
// };

// // Function to safely delete file
// const safeDeleteFile = (filePath) => {
//   try {
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (error) {
//     console.error("Error deleting file:", error);
//   }
// };

// // Function to wait for file to exist
// const waitForFile = async (filePath, maxAttempts = 5, delayMs = 1000) => {
//   for (let attempt = 0; attempt < maxAttempts; attempt++) {
//     if (fs.existsSync(filePath)) {
//       // Also check if file is accessible and not empty
//       try {
//         const stats = fs.statSync(filePath);
//         if (stats.size > 0) {
//           return true;
//         }
//       } catch (error) {
//         console.log(`File exists but not accessible on attempt ${attempt + 1}`);
//       }
//     }
//     console.log(`Waiting for file to be ready, attempt ${attempt + 1}`);
//     await new Promise(resolve => setTimeout(resolve, delayMs));
//   }
//   return false;
// };

// // Function to fill the Excel template
// const fillExcelTemplate = async (invoiceData, outputPath) => {
//   try {
//     const workbook = new ExcelJS.Workbook();
//     const templatePath = path.resolve(__dirname, '../utils/InvoiceTemplate/New Invoice Format.xlsx');

//     if (!fs.existsSync(templatePath)) {
//       throw new Error('Invoice template not found');
//     }

//     // Load the Excel template
//     await workbook.xlsx.readFile(templatePath);

//     const sheet = workbook.getWorksheet('Sheet 2');
//     if (!sheet) {
//       throw new Error('Worksheet "Sheet 2" not found in the Excel template');
//     }

//     // Map values to Excel cells
//     sheet.getCell('G8').value = invoiceData.invoiceNumber;
//     sheet.getCell('N8').value = formatDate(invoiceData.invoiceDate);
//     sheet.getCell('G10').value = formatDate(invoiceData.buyerWorkOrderDate);
//     sheet.getCell('Z8').value = invoiceData.transporterName;
//     sheet.getCell('Z9').value = invoiceData.transporterId;
//     sheet.getCell('Z10').value = invoiceData.vehicleNo;
//     sheet.getCell('Z11').value = invoiceData.ewayBillNumber;

//     sheet.getCell('A12').value = invoiceData.buyerName;
//     sheet.getCell('A13').value = invoiceData.buyerAddress;

//     sheet.getCell('H16').value = invoiceData.buyerGSTIN;
//     sheet.getCell('K17').value = invoiceData.panNo;
//     sheet.getCell('K18').value = invoiceData.stateCode;

//     sheet.getCell('S13').value = invoiceData.shippingAddress;

//     // Fill items table
//     let startRow = 20;
//     invoiceData.items.forEach((item, index) => {
//       const row = sheet.getRow(startRow + index);
//       row.getCell(1).value = index + 1;
//       row.getCell(2).value = item.description;
//       row.getCell(3).value = item.hsn;
//       row.getCell(4).value = item.unit;
//       row.getCell(5).value = item.quantity;
//       row.getCell(6).value = item.rate;
//       row.getCell(7).value = item.amount;
//     });

//     // Save the workbook
//     await workbook.xlsx.writeFile(outputPath);
//     return true;
//   } catch (error) {
//     console.error("Error filling Excel template:", error);
//     throw error;
//   }
// };

// // Controller to create a new invoice
// const createNewInvoice = async (req, res) => {
//   const tmpDir = path.resolve(__dirname, '../tmp');
//   let excelPath = null;
//   let pdfPath = null;

//   try {
//     // Ensure tmp directory exists
//     ensureDirectoryExists(tmpDir);

//     const {
//       buyerName, buyerAddress, buyerGSTIN, invoiceNumber, panNo,
//       stateCode, stateName, vehicleNo, transporterName, transporterId,
//       ewayBillNumber, shippingAddress, buyerWorkOrderDate, items,
//       transportCharges, installationCharges, taxableAmount,
//       cgstAmount, sgstAmount, igstAmount, gstAmount, totalAmount,
//       paymentTerms, notes,
//     } = req.body;

//     // Validate required fields
//     if (!buyerName || !buyerAddress || !buyerGSTIN || !invoiceNumber || !items || items.length === 0) {
//       return responseHandler(res, 400, false, 'Missing required fields', null);
//     }

//     // Create invoice document
//     const newInvoice = new Invoice({
//       buyerName, buyerAddress, buyerGSTIN, invoiceNumber, panNo,
//       stateCode, stateName, vehicleNo, transporterName, transporterId,
//       ewayBillNumber, shippingAddress, buyerWorkOrderDate, items,
//       transportCharges: transportCharges || 0,
//       installationCharges: installationCharges || 0,
//       taxableAmount, cgstAmount: cgstAmount || 0,
//       sgstAmount: sgstAmount || 0, igstAmount: igstAmount || 0,
//       gstAmount, totalAmount,
//       paymentTerms: paymentTerms || '',
//       notes: notes || '',
//     });

//     await newInvoice.save();

//     // Generate file paths with absolute paths
//     excelPath = path.resolve(tmpDir, `invoice-${newInvoice._id}.xlsx`);
//     pdfPath = path.resolve(tmpDir, `invoice-${newInvoice._id}.pdf`);

//     // Fill Excel template
//     await fillExcelTemplate(newInvoice, excelPath);
//     console.log("Excel file created at:", excelPath);

//     // Wait for Excel file to be ready
//     const excelReady = await waitForFile(excelPath);
//     if (!excelReady) {
//       throw new Error('Excel file creation failed or file is not accessible');
//     }

//     // Convert to PDF using the imported function
//     try {
//       await convertExcelToPdf(excelPath, pdfPath);
//       console.log("PDF created at:", pdfPath);

//       // Wait for PDF file to be ready
//       const pdfReady = await waitForFile(pdfPath);
//       if (!pdfReady) {
//         console.warn("PDF file not ready, falling back to Excel file");
//         pdfPath = excelPath;
//       }
//     } catch (pdfError) {
//       console.error("Error converting to PDF:", pdfError);
//       pdfPath = excelPath;
//     }

//     // Upload to Cloudinary
//     let uploadedUrl = null;
//     try {
//       const fileToUpload = pdfPath === excelPath ? excelPath : pdfPath;

//       // Final check before upload
//       if (!fs.existsSync(fileToUpload)) {
//         throw new Error(`File not found at path: ${fileToUpload}`);
//       }

//       // Verify file is not empty
//       const stats = fs.statSync(fileToUpload);
//       if (stats.size === 0) {
//         throw new Error(`File is empty: ${fileToUpload}`);
//       }

//       console.log(`Attempting to upload file: ${fileToUpload} (${stats.size} bytes)`);
//       const uploaded = await uploadImage(fileToUpload);

//       if (!uploaded || !uploaded.secure_url) {
//         throw new Error('Upload succeeded but no URL returned');
//       }

//       uploadedUrl = uploaded.secure_url;

//       // Update invoice with file URL
//       newInvoice.invoiceLink = uploadedUrl;
//       await newInvoice.save();

//       console.log('File uploaded successfully:', uploadedUrl);
//     } catch (uploadError) {
//       console.error('Cloudinary Upload Error:', uploadError);
//       return responseHandler(res, 201, true, 'Invoice created but file upload failed', {
//         invoice: newInvoice,
//         error: uploadError.message,
//         fileDetails: {
//           path: pdfPath === excelPath ? 'Excel' : 'PDF',
//           exists: fs.existsSync(pdfPath),
//           size: fs.existsSync(pdfPath) ? fs.statSync(pdfPath).size : 'N/A'
//         }
//       });
//     }

//     return responseHandler(res, 201, true, 'Invoice created successfully', {
//       invoice: newInvoice,
//       pdfUrl: uploadedUrl
//     });

//   } catch (error) {
//     console.error('Error in invoice creation:', error);
//     return responseHandler(res, 500, false, 'Error creating invoice', null, error.message);
//   } finally {
//     // Cleanup temporary files with delay to ensure upload is complete
//     setTimeout(() => {
//       if (excelPath) safeDeleteFile(excelPath);
//       if (pdfPath && pdfPath !== excelPath) safeDeleteFile(pdfPath);
//     }, 2000);
//   }
// };

// export { createNewInvoice };





import Order from '../models/order.model.js';
import Invoice from '../models/invoice.model.js';
import Client from '../models/clientEnquery.model.js';

import { checkUserExists } from '../utils/helper.js';
import responseHandler from '../utils/responseHandler.js';

import uploadImage from '../utils/upload.js';

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

    const isOrderExists = await Order.findById(orderId);
    if (!isOrderExists) {
      return responseHandler(res, 400, false, "Order does not exist", null);
    }

    const isClientExists = await Client.findById(clientId);
    if (!isClientExists) {
      return responseHandler(res, 400, false, "Client does not exist", null);
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

    return responseHandler(res, 201, true, "Invoice created successfully", newInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return responseHandler(res, 500, false, "Internal server error", null);
  }
};

// Get invoice form data
const getInvoiceFormDetails = async (req, res) => {
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

    const isOrderExists = await Order.findById(orderId);
    if (!isOrderExists) {
      return responseHandler(res, 400, false, "Order does not exist", null);
    }

    const isClientExists = await Client.findById(clientId);
    if (!isClientExists) {
      return responseHandler(res, 400, false, "Client does not exist", null);
    }

    const invoiceFormData = await Invoice.findOne({ clientId, orderId });

    if (invoiceFormData) {
      return responseHandler(res, 200, true, "Invoice form data fetched successfully", invoiceFormData);
    } else {
      return responseHandler(res, 205, true, "Invoice form data does not exist for this order and client", null);
    }
  } catch (error) {
    console.error("Error fetching invoice form data:", error);
    return responseHandler(res, 500, false, "Error fetching invoice form data", null);
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

    return responseHandler(res, 200, true, "Invoice updated successfully", invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return responseHandler(res, 500, false, "Internal server error", null);
  }
};




import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";


const uploadInvoiceExcelAndPdf = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id) return responseHandler(res, 401, false, "User not authorized", null);

    const userExists = await checkUserExists(id);
    if (!userExists) return responseHandler(res, 400, false, "User not found", null);

    const { invoiceId } = req.body;

    // check invoice exists 

    if (!invoiceId) {

      return responseHandler(res, 400, false, "invoice id is requrired", null);

    }

    const isInvoiceExists = await Invoice.findById(invoiceId);

    if (!isInvoiceExists) {

      return responseHandler(res, 400, false, "invoice does not exists", null);

    }

    const excelFile = req.files?.excelFile;

    if (!invoiceId || !excelFile) {
      return responseHandler(res, 400, false, "Missing invoiceId or Excel file", null);
    }

    // ✅ Save Excel temporarily
    const tempExcelPath = path.join(__dirname, `../temp/invoice-${invoiceId}.xlsx`);
    await excelFile.mv(tempExcelPath);

    // ✅ Upload Excel to Cloudinary
    const uploadedExcel = await uploadImage(tempExcelPath);
    const excelUrl = uploadedExcel?.secure_url;

    // ✅ Read Excel and convert to simple HTML
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(tempExcelPath);
    const worksheet = workbook.getWorksheet(1);

    let html = `<html><head><style>
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #888; padding: 8px; font-family: sans-serif; }
    </style></head><body><h2>Invoice</h2><table>`;

    worksheet.eachRow((row, rowNumber) => {
      html += `<tr>`;
      row.eachCell((cell) => {
        html += `<td>${cell.value}</td>`;
      });
      html += `</tr>`;
    });

    html += `</table></body></html>`;

    // ✅ Convert HTML to PDF using Puppeteer
    const tempPdfPath = path.join(__dirname, `../temp/invoice-${invoiceId}.pdf`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: tempPdfPath, format: "A4" });
    await browser.close();

    // ✅ Upload PDF
    const uploadedPdf = await uploadImage(tempPdfPath);
    const pdfUrl = uploadedPdf?.secure_url;

    // ✅ Cleanup
    fs.unlinkSync(tempExcelPath);
    fs.unlinkSync(tempPdfPath);

    isInvoiceExists.invoiceExcelLink = excelUrl;
    isInvoiceExists.invoiceExcelPdfLink = pdfUrl;

    await isInvoiceExists.save();

    return responseHandler(res, 200, true, "Excel & PDF uploaded successfully",isInvoiceExists);

  } catch (error) {
    console.error(error);
    return responseHandler(res, 500, false, "Error uploading files", null);
  }
};


export {
  createNewInvoice,
  getInvoiceFormDetails,
  updateInvoiceFormData,
  uploadInvoiceExcelAndPdf
};


