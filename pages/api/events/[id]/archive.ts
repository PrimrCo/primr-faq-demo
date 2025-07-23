import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../lib/mongo";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
  const { id } = req.query;
  if (!id || typeof id !== "string") return res.status(400).json({ error: "Missing event id" });

  const mongoClient = await clientPromise;
  const db = mongoClient.db();

  if (req.method === "PATCH") {
    const { archived } = req.body;
    await db.collection("events").updateOne(
      { _id: new ObjectId(id), user: session.user.email },
      { $set: { archived: !!archived, updatedAt: new Date() } }
    );
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["PATCH"]);
  res.status(405).end("Method Not Allowed");
}
