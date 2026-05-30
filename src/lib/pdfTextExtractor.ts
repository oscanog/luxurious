import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

// Use the bundled worker from pdfjs-dist
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/**
 * Extract all text from a PDF file using pdf.js in the browser.
 * This handles CMap fonts, CIDFont encoding, ToUnicode maps — everything
 * that a server-side regex parser cannot handle.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => (item.str as string) ?? "")
      .filter(Boolean)
      .join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts
    .join("\n\n")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
