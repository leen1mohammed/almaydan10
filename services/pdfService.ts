import { pathToFileURL } from "url";

export async function extractPdfFromUrl(pdfUrl: string) {
  const res = await fetch(pdfUrl);

  if (!res.ok) {
    throw new Error("Failed to fetch PDF");
  }

  const arrayBuffer = await res.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  // worker
  const workerPath = pathToFileURL(
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  ).href;

  pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;

  const pdf = await pdfjsLib.getDocument({
    data,
    useWorkerFetch: false,
    disableFontFace: true,
  } as any).promise;

  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");

    fullText += `\n\n[Page ${pageNumber}]\n${pageText}`;
  }

  return fullText;
}