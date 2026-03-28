import pdf from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { createCanvas, SKRSContext2D } from '@napi-rs/canvas';

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  type: 'text' | 'image' | 'mixed';
  ocrConfidence: number;
}

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
  ) {
    super(message);
  }
}

export class UnprocessableError extends AppError {
  constructor(message: string) {
    super(message, 'UNPROCESSABLE_ENTITY');
  }
}

/**
 * Type guard to safely treat a context as CanvasRenderingContext2D
 * satisfying the project requirement for logical flow proof.
 */
function isCanvasContext(ctx: unknown): ctx is CanvasRenderingContext2D {
  return (
    ctx !== null &&
    typeof ctx === 'object' &&
    'fillRect' in ctx &&
    'drawImage' in ctx &&
    'getImageData' in ctx
  );
}

export class PdfExtractor {
  async extractPdf(buffer: Buffer): Promise<PdfExtractResult> {
    try {
      const data = await pdf(buffer);
      const text = data.text;
      const pageCount = data.numpages;

      // Detection: if < 100 chars per page average -> image PDF
      const charsPerPage = text.length / pageCount;
      if (charsPerPage < 100) {
        return this.ocrPdf(buffer, pageCount);
      }

      return {
        text,
        pageCount,
        type: 'text',
        ocrConfidence: 100,
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('password')) {
          throw new UnprocessableError('PDF is password protected');
        }
        if (
          error.message.includes('corrupted') ||
          error.message.includes('Invalid PDF structure')
        ) {
          throw new UnprocessableError('PDF file is corrupted');
        }
      }
      throw error;
    }
  }

  private async ocrPdf(
    buffer: Buffer,
    pageCount: number,
  ): Promise<PdfExtractResult> {
    const pLimit = (await import('p-limit')).default;
    const pdfjs = await import('pdfjs-dist');
    const limit = pLimit(10);

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      stopAtErrors: false,
    });

    const pdfDocument = await loadingTask.promise;
    const pageImages: Buffer[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context: SKRSContext2D = canvas.getContext('2d');

      const unknownContext: unknown = context;
      if (isCanvasContext(unknownContext)) {
        await page.render({
          canvasContext: unknownContext,
          viewport,
        }).promise;
      } else {
        throw new Error('Failed to initialize compatible canvas context');
      }

      const pngBuffer: Buffer = canvas.toBuffer('image/png');
      pageImages.push(pngBuffer);
    }

    const results = await Promise.all(
      pageImages.map((imgBuffer, index) =>
        limit(async () => {
          const worker = await createWorker('eng');
          const { data } = await worker.recognize(imgBuffer);
          await worker.terminate();
          return {
            text: data.text,
            confidence: data.confidence,
            index,
          };
        }),
      ),
    );

    const fullText = results
      .sort((a, b) => a.index - b.index)
      .map((r) => r.text)
      .join('\n');

    const totalConfidence = results.reduce((acc, r) => acc + r.confidence, 0);
    const avgConfidence = totalConfidence / results.length;

    return {
      text: fullText,
      pageCount,
      type: 'image',
      ocrConfidence: avgConfidence,
    };
  }
}
export const pdfExtractor = new PdfExtractor();
