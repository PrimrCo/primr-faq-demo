import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongo";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const email = session.user.email;
  const mongoClient = await clientPromise;
  const db = mongoClient.db();
  const collection = db.collection("chats");

  if (req.method === "GET") {
    const chats = await collection.find({ user: email }).sort({ timestamp: -1 }).toArray();
    if (req.query.download) {
      // Format as plain text
      const lines = chats.map(
        (c) =>
          `Time: ${new Date(c.timestamp).toLocaleString()}\nQ: ${c.question}\nA: ${c.answer}\nSource: ${c.sourceFile}\n`
      );
      const txt = lines.join("\n----------------------\n\n");
      res.setHeader("Content-Disposition", "attachment; filename=chat-history.txt");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(txt);
    }
    return res.status(200).json({ chats });
  }

  if (req.method === "DELETE") {
    await collection.deleteMany({ user: email });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}