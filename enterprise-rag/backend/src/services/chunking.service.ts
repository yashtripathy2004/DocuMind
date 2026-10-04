export interface RawChunk {
  content: string;
  pageNumber: number;
  tokenCount: number;
}

export class ChunkingService {
  // 500 tokens approx 2000 chars; 100 token overlap approx 400 chars.
  // Preserves semantic sentence boundaries avoiding truncation mid-noun.
  private static targetChunkSize = 1800;
  private static overlapSize = 350;

  public static chunkDocument(pages: { pageNumber: number; text: string }[]): RawChunk[] {
    const chunks: RawChunk[] = [];

    for (const page of pages) {
      const pageText = this.cleanText(page.text);
      if (!pageText) continue;

      const pageChunks = this.splitText(pageText, page.pageNumber);
      chunks.push(...pageChunks);
    }

    return chunks;
  }

  private static cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private static splitText(text: string, pageNumber: number): RawChunk[] {
    const chunks: RawChunk[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + this.targetChunkSize;

      if (endIndex >= text.length) {
        endIndex = text.length;
      } else {
        // Fall back to nearest sentence terminator or paragraph boundary
        const boundaryIndex = this.findBoundary(text, endIndex);
        if (boundaryIndex !== -1 && boundaryIndex > startIndex + 200) {
          endIndex = boundaryIndex;
        }
      }

      const chunkContent = text.slice(startIndex, endIndex).trim();
      
      if (chunkContent.length > 50) {
        // Approximate token count: 1 token ~ 4 characters
        const tokenCount = Math.ceil(chunkContent.length / 4);
        chunks.push({
          content: chunkContent,
          pageNumber,
          tokenCount,
        });
      }

      if (endIndex >= text.length) break;

      startIndex = Math.max(startIndex + 1, endIndex - this.overlapSize);
    }

    return chunks;
  }

  private static findBoundary(text: string, targetIndex: number): number {
    const lookaheadWindow = 150;
    const searchSlice = text.slice(
      Math.max(0, targetIndex - 50),
      Math.min(text.length, targetIndex + lookaheadWindow)
    );

    const punctuationMatch = searchSlice.search(/(\.|\?|!|\n)\s/);
    if (punctuationMatch !== -1) {
      return Math.max(0, targetIndex - 50) + punctuationMatch + 1;
    }

    return targetIndex;
  }
}
