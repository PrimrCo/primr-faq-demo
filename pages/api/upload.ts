import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import fs from "fs";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import * as XLSX from "xlsx";
import path from "path";

// Add at the top with other imports
// import mammoth from "mammoth";
// import pdfParse from "pdf-parse";
// import * as XLSX from "xlsx";
// import path from "path";
// import fs from "fs";

// Helper to parse file based on extension
async function parseFile(file: any): Promise<string> {
  const ext = path.extname(file.originalFilename).toLowerCase();
  if (ext === ".txt" || ext === ".md") {
    return fs.readFileSync(file.filepath, "utf8");
  }
  if (ext === ".pdf") {
    const dataBuffer = fs.readFileSync(file.filepath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }
  if (ext === ".docx") {
    const data = await mammoth.extractRawText({ path: file.filepath });
    return data.value;
  }
  if (ext === ".csv" || ext === ".xlsx") {
    const workbook = XLSX.readFile(file.filepath);
    let text = "";
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      text += csv + "\n";
    });
    return text;
  }
  throw new Error("Unsupported file type");
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const form = formidable();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File parse error" });
    }
    const fileInput = files.file;
    const file = Array.isArray(fileInput) ? fileInput[0] : fileInput;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileStream = fs.createReadStream(file.filepath);
    const key = `${session.user.email}/${file.originalFilename}`;

    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          Body: fileStream,
          ContentType: file.mimetype,
        })
      );
      // Parse the file
      const parsedText = await parseFile(file);
      return res.status(200).json({ success: true, key, parsedText });
    } catch (e) {
      return res.status(500).json({ error: "S3 upload failed" });
    }
  });
}
