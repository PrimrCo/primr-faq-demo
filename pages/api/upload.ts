import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import fs from "fs";
import clientPromise from "../../lib/mongo";
import { ObjectId } from "mongodb";
import path from "path";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  let session = await getServerSession(req, res, authOptions);
  if (process.env.NODE_ENV === "test" && req.headers["x-test-user"]) {
    session = { user: { email: req.headers["x-test-user"] } };
  }
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

    if (!fs.existsSync(file.filepath)) {
      return res.status(400).json({ error: "File not found on server" });
    }

    const { eventId } = fields;
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    if (!eventIdStr || typeof eventIdStr !== "string" || !ObjectId.isValid(eventIdStr)) {
      return res.status(400).json({ error: "Invalid or missing eventId" });
    }

    // Define the S3 key
    const key = `${session.user.email}/${Date.now()}_${file.originalFilename}`;

    try {
      // Upload to S3
      const fileBuffer = fs.readFileSync(file.filepath);
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype || undefined,
      }));

      // Store metadata in MongoDB
      const client = await clientPromise;
      const db = client.db();
      await db.collection("files").insertOne({
        user: session.user.email,
        docKey: key,
        eventId: new ObjectId(eventIdStr),
        originalFilename: file.originalFilename,
        size: file.size,
        mimetype: file.mimetype,
        createdAt: new Date(),
      });

      // Extract text from file and create embeddings
      const fileText = fs.readFileSync(file.filepath, "utf-8"); // Assuming the file is text-based
      const chunks = splitTextIntoChunks(fileText); // Implement this function

      for (const chunk of chunks) {
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: chunk,
        });
        const embedding = embeddingResponse.data[0].embedding;
        await db.collection("embeddings").insertOne({
          user: session.user.email,
          eventId: new ObjectId(eventIdStr),
          docKey: key,
          chunk,
          embedding,
          createdAt: new Date(),
        });
      }

      // Clean up temp file
      fs.unlinkSync(file.filepath);

      return res.status(200).json({ success: true, key });
    } catch (e) {
      console.error("Upload error:", e);
      return res.status(500).json({ error: "An error occurred during upload." });
    }
  });
}

// Implement this function to split text into chunks
function splitTextIntoChunks(text: string, chunkSize = 2000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}
