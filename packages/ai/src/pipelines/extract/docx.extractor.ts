import * as mammoth from 'mammoth';

export interface DocxExtractResult {
  text: string;
}

export class DocxExtractor {
  async extractDocx(buffer: Buffer): Promise<DocxExtractResult> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value,
      };
    } catch (error) {
      throw new Error(
        `Word extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}

export const docxExtractor = new DocxExtractor();
