import pdfParse from "pdf-parse";
import fs from "fs";

/**
 * Extracts plain text from a .pdf file using pdf-parse.
 * @param filepath Path to the .pdf file
 * @returns Extracted plain text
 */
export async function extractTextFromPdf(filepath: string): Promise<string> {
  const buffer = fs.readFileSync(filepath);
  const data = await pdfParse(buffer);
  return data.text;
}