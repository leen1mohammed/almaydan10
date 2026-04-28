export function chunkText(text: string, chunkSize = 900, overlap = 150): string[] {
  const cleaned = text
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();

    if (chunk.length > 100) {
      chunks.push(chunk);
    }

    start += chunkSize - overlap;
  }

  return chunks;
}