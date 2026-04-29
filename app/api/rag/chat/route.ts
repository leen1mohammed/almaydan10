import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";
import { createEmbedding } from "@/services/embeddingService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required and must be a string" },
        { status: 400 }
      );
    }

    // 1) نحول سؤال المستخدم إلى embedding
    const queryEmbedding = await createEmbedding(message);

    // 2) نطلب من Supabase أقرب chunks
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_rag_data",
      {
        query_embedding: queryEmbedding,
        match_count: 5,
      }
    );

    if (matchError) {
      console.error("Match error:", matchError);
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    const usefulMatches = (matches || []).filter(
      (item: any) => item.similarity >= 0.25
    );

    const context = usefulMatches
      .map((item: any, index: number) => {
        return `
[Source ${index + 1}]
Title: ${item.source_title || "Unknown"}
Type: ${item.source_type || "Unknown"}
Similarity: ${item.similarity}
Content: ${item.content}
`;
      })
      .join("\n\n");

    // 3) نخلي النموذج يجاوب فقط من السياق
    const systemPrompt = `
You are Humaidan, an esports assistant for Almaydan.

Rules:
- Answer only using the provided context.
- If the answer is not in the context, say that the information is not available in the provided sources.
- Do not invent facts.
- Answer in the same language as the user.
- Keep the answer clear and helpful.
- At the end, mention the sources used by title if available.
`;

    const userPrompt = `
User question:
${message}

Retrieved context:
${context || "No relevant context found."}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    const answer =
      completion.choices[0]?.message?.content ||
      "ما قدرت أطلع إجابة من المصادر المتوفرة.";

    return NextResponse.json({
      answer,
      sources: usefulMatches.map((item: any) => ({
        title: item.source_title,
        type: item.source_type,
        similarity: item.similarity,
      })),
    });
  } catch (error: any) {
    console.error("RAG chat error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected chat error" },
      { status: 500 }
    );
  }
}