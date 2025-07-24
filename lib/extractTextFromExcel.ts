import * as XLSX from "xlsx";
import fs from "fs";

/**
 * Extracts plain text from a .csv file.
 * @param filepath Path to the .csv file
 * @returns Extracted plain text
 */
export async function extractTextFromCsv(filepath: string): Promise<string> {
  const data = fs.readFileSync(filepath, "utf-8");
  return data;
}

/**
 * Extracts plain text from a .xlsx file using xlsx library.
 * @param filepath Path to the .xlsx file
 * @returns Extracted plain text (all sheets combined)
 */
export async function extractTextFromXlsx(filepath: string): Promise<string> {
  const buffer = fs.readFileSync(filepath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  
  let text = "";
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const csvText = XLSX.utils.sheet_to_csv(worksheet);
    text += `\n--- Sheet: ${sheetName} ---\n${csvText}\n`;
  }
  
  return text.trim();
}