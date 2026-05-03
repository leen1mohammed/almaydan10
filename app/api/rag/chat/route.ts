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

    // 🔥 1) تحسين السؤال قبل البحث
    const enhancedQuery = `
${message}
حوّل هذا السؤال إلى صيغة بحث معلوماتي دقيقة لاستخراج الإجابة من مستند.
`;

    const queryEmbedding = await createEmbedding(enhancedQuery);

    // 🔥 2) جلب عدد أكبر من النتائج
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_rag_data",
      {
        query_embedding: queryEmbedding,
        match_count: 10,
      }
    );

    console.log("Matches:", matches);

    if (matchError) {
      console.error("Match error:", matchError);
      return NextResponse.json({ error: matchError.message }, { status: 500 });
    }

    // 🔥 3) لا نفلتر بالـ similarity (المودل يقرر)
    const usefulMatches = (matches || []).slice(0, 8);

    // 🔥 4) بناء context بشكل أنظف
    const context = usefulMatches
      .map((item: any, index: number) => {
        return `[${index + 1}] ${item.content}`;
      })
      .join("\n\n");

    // 🔥 5) Prompt أقوى (يمنع الهبد ويستخرج المعلومات)
    const systemPrompt = `
You are Humaidan, an esports assistant for Almaydan.

STRICT RULES:
- Use ONLY the provided context
- DO NOT hallucinate or invent information

IMPORTANT:
- If the answer exists partially → extract it
- If the answer is implied → infer it carefully
- DO NOT say "not available" unless absolutely nothing is found

STYLE:
- Answer in the same language as the user
- Be clear and natural
`;

    const userPrompt = `
السؤال:
${message}

اعتمد فقط على المعلومات التالية للإجابة:

${context || "لا يوجد سياق"}
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