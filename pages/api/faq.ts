import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../lib/mongo";
import OpenAI from "openai";

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

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: "No question provided" });
  }

  // Initialize OpenAI client inside the handler
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Embed the question
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: question,
  });
  const questionEmbedding = embeddingResponse.data[0].embedding;

  // Fetch all embeddings for this user
  const mongoClient = await clientPromise;
  const db = mongoClient.db();
  const collection = db.collection("embeddings");
  const userEmbeddings = await collection.find({ user: session.user.email }).toArray();

  // Find the most similar chunk
  let bestScore = -Infinity;
  let bestChunk = "";
  for (const entry of userEmbeddings) {
    const score = cosineSimilarity(questionEmbedding, entry.embedding);
    if (score > bestScore) {
      bestScore = score;
      bestChunk = entry.chunk;
    }
  }

  // Use OpenAI completion to answer the question based on the best chunk
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful assistant. Answer the user's question based on the provided context." },
      { role: "user", content: `Context: ${bestChunk}\n\nQuestion: ${question}` },
    ],
  });

  return res.status(200).json({ answer: completion.choices[0].message?.content ?? "" });
}