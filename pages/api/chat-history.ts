import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongo";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log("NODE_ENV:", process.env.NODE_ENV, "x-test-user:", req.headers["x-test-user"]);

  let session = await getServerSession(req, res, authOptions);
  if (process.env.NODE_ENV === "test" && req.headers["x-test-user"]) {
    session = { user: { email: req.headers["x-test-user"] } };
  }
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const email = session.user.email;
  const mongoClient = await clientPromise;
  const db = mongoClient.db();
  const collection = db.collection("chats");

  if (req.method === "GET") {
    const { eventId } = req.query;
    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "Missing eventId" });
    }
    try {
      const chats = await db.collection("chats").find({
        user: session.user.email,
        eventId: new ObjectId(eventId),
      }).toArray();
      return res.status(200).json({ chats });
    } catch (e) {
      return res.status(400).json({ error: "Invalid eventId" });
    }
  }

  if (req.method === "DELETE") {
    const { eventId } = req.query;
    if (!eventId || typeof eventId !== "string") {
      return res.status(400).json({ error: "Missing eventId" });
    }
    await collection.deleteMany({ user: email, eventId: new ObjectId(eventId) });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}