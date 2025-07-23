import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongo";
import { ObjectId } from "mongodb";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

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

  const mongoClient = await clientPromise;
  const db = mongoClient.db();

  const { question, eventId } = req.body;
  if (!question) {
    return res.status(400).json({ error: "No question provided" });
  }
  if (!eventId) {
    return res.status(400).json({ error: "Missing eventId" });
  }

  // 1. Retrieve event and ensure it exists
  const event = await db.collection("events").findOne({
    _id: new ObjectId(eventId),
    user: session.user.email,
  });
  if (!event) return res.status(404).json({ error: "Event not found" });

  // 2. Retrieve all embeddings for this event/user
  const userEmbeddings = await db.collection("embeddings").find({
    user: session.user.email,
    eventId: new ObjectId(eventId),
  }).toArray();

  if (!userEmbeddings.length) {
    return res.status(404).json({ error: "No document embeddings found for this event. Please upload and parse a document first." });
  }

  // 3. Embed the question using OpenAI
  let questionEmbedding: number[];
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question,
    });
    questionEmbedding = embeddingResponse.data[0].embedding;
  } catch (e) {
    console.error("OpenAI embedding error:", e);
    return res.status(500).json({ error: "Failed to embed question." });
  }

  // 4. Find the most similar chunk
  let bestScore = -Infinity;
  let bestChunk = "";
  let bestEntry = null;
  for (const entry of userEmbeddings) {
    if (!entry.embedding || !Array.isArray(entry.embedding)) continue;
    const score = cosineSimilarity(questionEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestChunk = entry.chunk;
      bestEntry = entry;
    }
  }

  if (!bestChunk) {
    return res.status(404).json({ error: "No relevant content found in your documents for this question." });
  }

  // 5. Use OpenAI completion to answer the question based on the best chunk
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant. Answer the user's question based on the provided context." },
        { role: "user", content: `Context: ${bestChunk}\n\nQuestion: ${question}` },
      ],
    });
  } catch (e) {
    console.error("OpenAI completion error:", e);
    return res.status(500).json({ error: "Failed to generate answer from OpenAI." });
  }

  const answer = completion.choices[0].message?.content ?? "";
  const sourceFile = bestEntry?.docKey || "unknown";
  const sourceSnippet = bestChunk || "";

  // 6. Store the Q&A in chat history
  await db.collection("chats").insertOne({
    user: session.user.email,
    question,
    answer,
    sourceFile,
    sourceSnippet,
    eventId: new ObjectId(eventId),
    timestamp: new Date(),
  });

  return res.status(200).json({ answer });
}