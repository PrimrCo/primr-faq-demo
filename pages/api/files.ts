import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import clientPromise from "../../lib/mongo";
import { ObjectId } from "mongodb";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let session = await getServerSession(req, res, authOptions);
  if (process.env.NODE_ENV === "test" && req.headers["x-test-user"]) {
    session = { user: { email: req.headers["x-test-user"] } };
  }
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // GET: List files for an event from MongoDB
  if (req.method === "GET") {
    const { eventId } = req.query;
    if (!eventId || typeof eventId !== "string" || !ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Missing or invalid eventId" });
    }
    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    const files = await db.collection("files")
      .find({ user: session.user.email, eventId: new ObjectId(eventId) })
      .sort({ createdAt: -1 })
      .toArray();
    return res.status(200).json({ files });
  }

  // POST: (Optional) Add file metadata directly (not used for uploads, but kept for completeness)
  if (req.method === "POST") {
    const { eventId, docKey, originalFilename, size, mimetype } = req.body;
    if (
      !eventId || typeof eventId !== "string" || !ObjectId.isValid(eventId) ||
      !docKey || typeof docKey !== "string" ||
      !originalFilename || typeof originalFilename !== "string"
    ) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }
    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    await db.collection("files").insertOne({
      user: session.user.email,
      eventId: new ObjectId(eventId),
      docKey,
      originalFilename,
      size,
      mimetype,
      createdAt: new Date(),
    });
    return res.status(201).json({ success: true });
  }

  // DELETE: Remove file from S3 and MongoDB
  if (req.method === "DELETE") {
    const { key, eventId } = req.query;
    if (!key || typeof key !== "string") {
      return res.status(400).json({ error: "Missing key" });
    }
    if (!eventId || typeof eventId !== "string" || !ObjectId.isValid(eventId)) {
      return res.status(400).json({ error: "Missing or invalid eventId" });
    }

    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }));

    // Delete from MongoDB (files, embeddings, chats)
    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    await db.collection("files").deleteOne({ user: session.user.email, eventId: new ObjectId(eventId), docKey: key });
    await db.collection("embeddings").deleteMany({ user: session.user.email, docKey: key });
    await db.collection("chats").deleteMany({ user: session.user.email, sourceFile: key });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}