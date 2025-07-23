import mammoth from "mammoth";
import fs from "fs";

/**
 * Extracts plain text from a .docx file using mammoth.
 * @param filepath Path to the .docx file
 * @returns Extracted plain text
 */
export async function extractTextFromDocx(filepath: string): Promise<string> {
  const buffer = fs.readFileSync(filepath);
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}