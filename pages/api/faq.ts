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

interface EmbeddingEntry {
  docKey: string;
  chunk: string;
  embedding: number[];
  _id?: unknown;
  user?: string;
  eventId?: unknown;
  [key: string]: unknown; // for other fields like _id, user, eventId, etc.
}

function isEmbeddingEntry(entry: unknown): entry is EmbeddingEntry {
  return (
    typeof entry === "object" &&
    entry !== null &&
    typeof (entry as EmbeddingEntry).docKey === "string" &&
    typeof (entry as EmbeddingEntry).chunk === "string" &&
    Array.isArray((entry as EmbeddingEntry).embedding)
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
  const rawEmbeddings = await db.collection("embeddings").find({
    user: session.user.email,
    eventId: new ObjectId(eventId),
  }).toArray();

  const userEmbeddings = rawEmbeddings.filter(isEmbeddingEntry) as unknown as EmbeddingEntry[];

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

  // 4. Find the top N most similar chunks
  const TOP_N = 5;
  const scoredChunks = userEmbeddings
    .filter(entry => entry.embedding && Array.isArray(entry.embedding))
    .map(entry => ({
      ...entry,
      score: cosineSimilarity(questionEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  const context = scoredChunks.map(entry =>
    `From file: ${entry.docKey}\n${entry.chunk}`
  ).join("\n\n---\n\n");

  // 5. Use OpenAI completion to answer the question based on the best chunks
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant. Answer the user's question based on the provided context." },
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
      ],
    });
  } catch (e) {
    console.error("OpenAI completion error:", e);
    return res.status(500).json({ error: "Failed to generate answer from OpenAI." });
  }

  const answer = completion.choices[0].message?.content ?? "";
  const sourceFiles = scoredChunks.map(entry => entry.docKey);

  await db.collection("chats").insertOne({
    user: session.user.email,
    question,
    answer,
    sourceFiles,
    eventId: new ObjectId(eventId),
    timestamp: new Date(),
  });

  return res.status(200).json({ answer });
}