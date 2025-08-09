import type { ReadableStream } from "stream/web";

export type IndexProgressEvent =
  | { type: "start"; totalFiles: number }
  | { type: "indexing"; fileIndex: number; fileName: string; progress: number }
  | { type: "complete" };

export async function indexFilesToPinecone(
  files: Array<{ url: string; name: string }>,
  onProgress: (event: IndexProgressEvent) => void
) {
  // Placeholder implementation. Swap with real Pinecone + embedding logic.
  onProgress({ type: "start", totalFiles: files.length });
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const steps = 10;
    for (let s = 1; s <= steps; s++) {
      await new Promise((r) => setTimeout(r, 120));
      onProgress({ type: "indexing", fileIndex: i, fileName: file.name, progress: Math.round((s / steps) * 100) });
    }
  }
  onProgress({ type: "complete" });
}


