import { NextResponse } from "next/server";
import { extractPdfFromUrl } from "@/services/pdfService";
import { chunkText } from "@/services/chunkingService";
import { createEmbedding } from "@/services/embeddingService";
import { supabase } from "@/lib/supabase";

export async function POST() {
  try {
    const { data: files, error: listError } = await supabase
      .storage
      .from("rag-files")
      .list("", { limit: 100 });

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No files found in bucket"
      });
    }

    let totalChunks = 0;
    let processedFiles = 0;

    for (const file of files) {
      if (!file.name.endsWith(".pdf")) continue;

      const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/rag-files/${file.name}`;
      console.log("Processing:", fileUrl);
      const { data: existing } = await supabase
        .from("rag_data")
        .select("id")
        .eq("source_url", fileUrl)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log("Skipped (already exists):", file.name);
        continue;
      }

      const text = await extractPdfFromUrl(fileUrl);

      const chunks = chunkText(text);

      console.log(`Chunks for ${file.name}:`, chunks.length);

      const rows = [];

      for (let i = 0; i < chunks.length; i++) {
        const embedding = await createEmbedding(chunks[i]);

        rows.push({
          content: chunks[i],
          source_type: "pdf",
          source_title: file.name,
          source_url: fileUrl,
          chunk_index: i,
          metadata: {
            type: "pdf",
            fileName: file.name,
            index: i
          },
          embedding
        });
      }
      const { error: insertError } = await supabase
        .from("rag_data")
        .insert(rows);

      if (insertError) {
        console.error("Insert error:", insertError.message);
        continue;
      }

      processedFiles++;
      totalChunks += rows.length;
    }

    return NextResponse.json({
      success: true,
      filesProcessed: processedFiles,
      totalChunks
    });

  } catch (error: any) {
    console.error("INGEST ERROR:", error);

    return NextResponse.json(
      {
        error: error.message || "Unexpected error"
      },
      { status: 500 }
    );
  }
}