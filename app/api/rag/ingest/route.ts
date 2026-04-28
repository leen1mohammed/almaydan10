import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { chunkText } from "@/services/chunkingService";
import { createEmbedding } from "@/services/embeddingService";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      content,
      sourceType = "manual",
      sourceTitle = "Untitled Source",
      sourceUrl = null,
      section = null,
    } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required and must be a string" },
        { status: 400 }
      );
    }

    const chunks = chunkText(content);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No valid chunks generated from content" },
        { status: 400 }
      );
    }

    const rows = [];

    for (let i = 0; i < chunks.length; i++) {
      const embedding = await createEmbedding(chunks[i]);

      rows.push({
        content: chunks[i],
        source_type: sourceType,
        source_title: sourceTitle,
        source_url: sourceUrl,
        section,
        chunk_index: i,
        metadata: {
          sourceType,
          sourceTitle,
          sourceUrl,
          section,
        },
        embedding,
      });
    }

    const { error } = await supabase
      .from("rag_data")
      .insert(rows);

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chunksInserted: rows.length,
    });
  } catch (error: any) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: error.message || "Unexpected ingest error" },
      { status: 500 }
    );
  }
}