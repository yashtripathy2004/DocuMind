import pdfParseModule from 'pdf-parse';
import mammoth from 'mammoth';
import { ParsedDocumentResult } from '../types/index.js';
import { ApiError } from '../utils/api-error.js';

// Safe interop for pdf-parse in ESM/NodeNext
const pdfParse = (pdfParseModule as any).default || pdfParseModule;

export class ParserService {
  public static async parse(buffer: Buffer, mimeType: string, filename: string): Promise<ParsedDocumentResult> {
    if (mimeType === 'application/pdf' || filename.endsWith('.pdf')) {
      return this.parsePdf(buffer);
    }

    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filename.endsWith('.docx')
    ) {
      return this.parseDocx(buffer);
    }

    if (mimeType.startsWith('text/') || filename.endsWith('.txt') || filename.endsWith('.md')) {
      return this.parseText(buffer);
    }

    throw ApiError.badRequest(`Cannot parse file ${filename}: Unsupported MIME type (${mimeType})`);
  }

  private static async parsePdf(buffer: Buffer): Promise<ParsedDocumentResult> {
    const pages: { pageNumber: number; text: string }[] = [];

    // Custom page rendering handler to isolate text page by page
    const renderPage = (pageData: any) => {
      return pageData.getTextContent().then((textContent: any) => {
        let lastY: number | null = null;
        let text = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === null) {
            text += item.str;
          } else {
            text += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({ pageNumber: pageData.pageIndex + 1, text: text.trim() });
        return text;
      });
    };

    const data = await pdfParse(buffer, { pagerender: renderPage });

    return {
      text: data.text,
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: data.text }],
    };
  }

  private static async parseDocx(buffer: Buffer): Promise<ParsedDocumentResult> {
    const result = await mammoth.extractRawText({ buffer });
    const cleanText = result.value.trim();
    return {
      text: cleanText,
      pages: [{ pageNumber: 1, text: cleanText }],
    };
  }

  private static async parseText(buffer: Buffer): Promise<ParsedDocumentResult> {
    const text = buffer.toString('utf-8').trim();
    return {
      text,
      pages: [{ pageNumber: 1, text }],
    };
  }
}
