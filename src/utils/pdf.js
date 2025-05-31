import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export const convertExcelToPdf = async (excelPath) => {
  const pdfPath = excelPath.replace('.xlsx', '.pdf');
  await execAsync(`libreoffice --headless --convert-to pdf --outdir tmp ${excelPath}`);
  return pdfPath;
};



