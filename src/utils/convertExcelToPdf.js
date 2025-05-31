import ExcelJS from 'exceljs';
// import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

export const convertExcelToPdf = async (excelPath, pdfPath) => {
  try {
    // Create a temporary HTML file to render the Excel content
    // const htmlPath = excelPath.replace('.xlsx', '.html');
    
    // // Read the Excel file
    // const workbook = new ExcelJS.Workbook();
    // await workbook.xlsx.readFile(excelPath);
    // const worksheet = workbook.getWorksheet('Sheet 2');

    // // Convert Excel to HTML
    // let htmlContent = `
    //   <!DOCTYPE html>
    //   <html>
    //   <head>
    //     <style>
    //       body { font-family: Arial, sans-serif; }
    //       table { border-collapse: collapse; width: 100%; }
    //       th, td { border: 1px solid black; padding: 8px; }
    //       .left-align { text-align: left; }
    //       .center-align { text-align: center; }
    //       .merged-cell { background-color: inherit; }
    //     </style>
    //   </head>
    //   <body>
    //     <table>
    // `;

    // // Convert worksheet to HTML
    // worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    //   htmlContent += '<tr>';
    //   row.eachCell({ includeEmpty: true }, (cell) => {
    //     const value = cell.value || '';
    //     const alignment = cell.alignment?.horizontal || 'center';
    //     const colspan = cell.isMerged ? cell.master._mergeCount : 1;
        
    //     if (cell.isMerged && cell !== cell.master) {
    //       // Skip merged cells that aren't the master
    //       return;
    //     }

    //     htmlContent += `
    //       <td colspan="${colspan}" class="${alignment}-align merged-cell">
    //         ${value}
    //       </td>
    //     `;
    //   });
    //   htmlContent += '</tr>';
    // });

    // htmlContent += `
    //     </table>
    //   </body>
    //   </html>
    // `;

    // // Write HTML to temporary file
    // fs.writeFileSync(htmlPath, htmlContent);

    // // Convert HTML to PDF using Puppeteer
    // const browser = await puppeteer.launch({
    //   headless: 'new',
    //   args: ['--no-sandbox']
    // });
    // const page = await browser.newPage();
    // await page.setViewport({ width: 1200, height: 1600 });
    
    // // Load HTML file
    // await page.goto(`file://${htmlPath}`, {
    //   waitUntil: 'networkidle0'
    // });

    // // Generate PDF
    // await page.pdf({
    //   path: pdfPath,
    //   format: 'A4',
    //   printBackground: true,
    //   margin: {
    //     top: '20px',
    //     right: '20px',
    //     bottom: '20px',
    //     left: '20px'
    //   }
    // });

    // await browser.close();

    // // Clean up temporary HTML file
    // fs.unlinkSync(htmlPath);

    console.log('PDF created successfully at:', pdfPath);
  } catch (error) {
    console.error('Error converting Excel to PDF:', error);
    throw error;
  }
};


