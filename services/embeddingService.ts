import { openai } from "@/lib/openai";

export async function createEmbedding(input: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0].embedding;
}