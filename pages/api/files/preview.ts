import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function streamToString(stream: Readable): Promise<string> {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let session = await getServerSession(req, res, authOptions);
  if (process.env.NODE_ENV === "test" && req.headers["x-test-user"]) {
    const testUser = Array.isArray(req.headers["x-test-user"])
      ? req.headers["x-test-user"][0]
      : req.headers["x-test-user"];
    session = {
      user: { email: testUser },
      expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { key } = req.query;
  if (!key || typeof key !== "string") return res.status(400).json({ error: "Missing key" });

  // Only allow access to user's own files
  if (!key.startsWith(`${session.user.email}/`)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
    });
    const data = await s3.send(command);
    const body = data.Body as Readable;
    const text = await streamToString(body);
    const preview = text.slice(0, 500);
    return res.status(200).json({ preview });
  } catch (e) {
    return res.status(500).json({ error: "Could not preview file" });
  }
}