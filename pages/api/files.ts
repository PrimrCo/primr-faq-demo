import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import clientPromise from "../../lib/mongo";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const prefix = `${session.user.email}/`;

  if (req.method === "GET") {
    // List files
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET!,
      Prefix: prefix,
    });
    const data = await s3.send(command);
    const files = (data.Contents || []).map((obj) => ({
      key: obj.Key,
      name: obj.Key?.replace(prefix, ""),
      size: obj.Size,
      lastModified: obj.LastModified,
    })).filter(f => f.name); // filter out folder itself
    return res.status(200).json({ files });
  }

  if (req.method === "DELETE") {
    const { key } = req.query;
    if (!key || typeof key !== "string") return res.status(400).json({ error: "Missing key" });

    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    }));

    // Delete from MongoDB (embeddings and chats)
    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    await db.collection("embeddings").deleteMany({ user: session.user.email, docKey: key });
    await db.collection("chats").deleteMany({ user: session.user.email, sourceFile: key });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}