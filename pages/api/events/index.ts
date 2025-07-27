import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../lib/mongo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log("NODE_ENV:", process.env.NODE_ENV, "x-test-user:", req.headers["x-test-user"]);

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
  const mongoClient = await clientPromise;
  const db = mongoClient.db();

  if (req.method === "GET") {
    const events = await db.collection("events").find({ user: session.user.email }).toArray();
    return res.status(200).json({ events });
  }

  if (req.method === "POST") {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Missing event name" });
    const now = new Date();
    const result = await db.collection("events").insertOne({
      user: session.user.email,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      archived: false,
    });
    return res.status(201).json({ _id: result.insertedId, name: name.trim() });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).end("Method Not Allowed");
}
