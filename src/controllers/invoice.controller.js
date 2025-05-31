import responseHandler from '../utils/responseHandler.js';
import Invoice from '../models/invoice.model.js';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { convertExcelToPdf } from '../utils/convertExcelToPdf.js';
import uploadImage from '../utils/upload.js';
import { fileURLToPath } from 'url';

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const formatDate = (date) => new Date(date).toLocaleDateString('en-IN');

// Function to fill the Excel template

const fillExcelTemplate = async (invoiceData, outputPath) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.resolve(__dirname, '../utils/InvoiceTemplate/New Invoice Format.xlsx');

    // Load the Excel template
    await workbook.xlsx.readFile(templatePath);

    const sheet = workbook.getWorksheet('Sheet 2'); // Ensure the correct sheet name
    if (!sheet) {
      throw new Error('Worksheet "Sheet 2" not found in the Excel template');
    }

    // Map values to Excel cells
    sheet.getCell('G8').value = invoiceData.invoiceNumber; // Invoice No.
    sheet.getCell('N8').value = formatDate(invoiceData.invoiceDate); // Date
    sheet.getCell('G10').value = formatDate(invoiceData.buyerWorkOrderDate); // Work Order Date
    sheet.getCell('Z8').value = invoiceData.transporterName; // Transporter Name
    sheet.getCell('Z9').value = invoiceData.transporterId; // Transporter ID
    sheet.getCell('Z10').value = invoiceData.vehicleNo; // Vehicle Number
    sheet.getCell('Z11').value = invoiceData.ewayBillNumber; // e-Way Bill Number

    sheet.getCell('A12').value = invoiceData.buyerName; // Buyer Name
    sheet.getCell('A13').value = invoiceData.buyerAddress; // Buyer Address

    sheet.getCell('H16').value = invoiceData.buyerGSTIN; // GSTIN
    sheet.getCell('K17').value = invoiceData.panNo; // PAN
    sheet.getCell('K18').value = invoiceData.stateCode; // State Code

    sheet.getCell('S13').value = invoiceData.shippingAddress; // State Name


    // Fill items table
    let startRow = 20; // Starting row for items
    const preExistingRows = 3; // Number of pre-existing rows in the template

    // Get the template row for formatting
    const templateRow = sheet.getRow(startRow);

    // Define the column groups that need to be merged
    const columnGroups = [
      { start: 'D', end: 'R', field: 'description' },    // Description of Goods
      { start: 'S', end: 'V', field: 'hsn' },           // HSN/SAC Code
      { start: 'W', end: 'X', field: 'unit' },          // Unit
      { start: 'Y', end: 'AB', field: 'price' },        // Unit Price
      { start: 'AC', end: 'AE', field: 'qty' },         // Qty
      { start: 'AF', end: 'AL', field: 'total' }        // Total Value
    ];

    // Helper function to get column number from letter
    const getColumnNumber = (col) => {
      let value = 0;
      for (let i = 0; i < col.length; i++) {
        value = value * 26 + col.charCodeAt(i) - 64;
      }
      return value;
    };

    invoiceData.items.forEach((item, index) => {
      const currentRow = startRow + index;

      if (index >= preExistingRows) {
        // Copy the entire template row structure
        const newRowData = [];
        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          newRowData[colNumber - 1] = '';  // Initialize with empty values
        });
        
        // Insert new row with template's structure
        const newRow = sheet.insertRow(currentRow, newRowData);
        
        // Copy row properties and formatting
        newRow.height = templateRow.height;
        
        // Copy cell properties from template
        templateRow.eachCell({ includeEmpty: true }, (templateCell, colNumber) => {
          const newCell = newRow.getCell(colNumber);
          
          // Copy styles and formatting
          if (templateCell.style) newCell.style = templateCell.style;
          if (templateCell.border) newCell.border = templateCell.border;
          if (templateCell.fill) newCell.fill = templateCell.fill;
          if (templateCell.font) newCell.font = templateCell.font;
          if (templateCell.alignment) newCell.alignment = templateCell.alignment;
        });

        // Apply column merges for each group
        columnGroups.forEach(group => {
          const startCol = getColumnNumber(group.start);
          const endCol = getColumnNumber(group.end);
          try {
            sheet.mergeCells(currentRow, startCol, currentRow, endCol);
            
            // Set alignment for merged cell
            const mergedCell = newRow.getCell(group.start);
            mergedCell.alignment = {
              vertical: 'middle',
              horizontal: group.field === 'description' ? 'left' : 'center'
            };
          } catch (error) {
            console.warn(`Warning: Could not merge cells ${group.start}-${group.end} in row ${currentRow}`);
          }
        });
      }

      const row = sheet.getRow(currentRow);

      // Fill data
      row.getCell('A').value = index + 1;
      row.getCell('D').value = item.description;
      row.getCell('S').value = item.hsn;
      row.getCell('W').value = item.unit;
      row.getCell('Y').value = item.rate;
      row.getCell('AC').value = item.quantity;
      row.getCell('AF').value = item.total;

      // Set specific alignments
      row.getCell('A').alignment = { vertical: 'middle', horizontal: 'center' };

      row.commit();
    });

    // Calculate the row for totals and charges
    const totalsRow = startRow + invoiceData.items.length + 1;

    // Fill totals and charges
    sheet.getCell(`S${totalsRow}`).value = invoiceData.transportCharges; // Transportation Charges
    // sheet.getCell(`S${totalsRow + 1}`).value = invoiceData.taxableAmount; // Taxable Amount
    // sheet.getCell(`S${totalsRow + 2}`).value = invoiceData.sgstAmount;    // SGST
    // sheet.getCell(`S${totalsRow + 3}`).value = invoiceData.cgstAmount;    // CGST
    // sheet.getCell(`S${totalsRow + 4}`).value = invoiceData.igstAmount;    // IGST
    // sheet.getCell(`S${totalsRow + 5}`).value = invoiceData.totalAmount;   // Total Amount

    // Save the filled Excel file
    await workbook.xlsx.writeFile(outputPath);
    console.log('Excel file saved at:', outputPath);
  } catch (error) {
    console.error('Error filling Excel template:', error);
    throw error;
  }
};


// Controller to create a new invoice
const createNewInvoice = async (req, res) => {
  try {
    const {
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

    console.log("Creating new invoice with data:", shippingAddress);

    // Validate required fields
    if (
      !buyerName || !buyerAddress || !buyerGSTIN || !panNo || !stateCode ||
      !stateName || !shippingAddress || !vehicleNo || !transporterName || !items || items.length === 0
    ) {
      return responseHandler(res, 400, false, 'Missing required fields', null);
    }

    // Create a new invoice document
    const newInvoice = new Invoice({
      buyerName,
      buyerAddress,
      buyerGSTIN,
      panNo,
      stateCode,
      stateName,
      invoiceNumber,
      vehicleNo,
      transporterName,
      transporterId,
      ewayBillNumber,
      buyerWorkOrderDate,
      shippingAddress: shippingAddress || '',
      items,
      transportCharges: transportCharges || 0,
      installationCharges: installationCharges || 0,
      taxableAmount,
      cgstAmount: cgstAmount || 0,
      sgstAmount: sgstAmount || 0,
      igstAmount: igstAmount || 0,
      gstAmount,
      totalAmount,
      paymentTerms: paymentTerms || '',
      notes: notes || '',
    });

    await newInvoice.save();

    // Fill the Excel template
    const tmpDir = path.resolve(__dirname, '../tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const excelPath = path.join(tmpDir, `invoice-${newInvoice._id}.xlsx`);
    await fillExcelTemplate(newInvoice, excelPath);

    // Convert the Excel file to PDF
    const pdfPath = path.join(tmpDir, `invoice-${newInvoice._id}.pdf`);
    await convertExcelToPdf(excelPath, pdfPath);

    // Upload the PDF to Cloudinary
    let uploaded;
    try {
      uploaded = await uploadImage(pdfPath);

      console.log("Uploaded PDF URL:", uploaded.secure_url);


    } catch (uploadError) {
      console.error('Cloudinary Upload Error:', uploadError);
      return responseHandler(res, 500, false, 'Failed to upload PDF to Cloudinary', null);
    }

    if (!uploaded || !uploaded.secure_url) {
      return responseHandler(res, 500, false, 'Failed to retrieve uploaded PDF URL', null);
    }

    return responseHandler(res, 201, true, 'Invoice created and uploaded', {
      invoice: newInvoice,
      pdfUrl: uploaded.secure_url,
    });
  } catch (error) {
    console.error('Error creating new invoice:', error);
    return responseHandler(res, 500, false, 'Internal Server Error', null);
  }
};


export { createNewInvoice };

