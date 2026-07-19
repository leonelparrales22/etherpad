import { ExportGenerator } from './ExportGenerator';
import { PadContent } from '../types/export.types';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

/**
 * Simplified PDF generator - creates PDF with plain text using pdfkit
 */
export class PdfGenerator implements ExportGenerator {
  async generate(padContent: PadContent): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, compress: false });
      const stream = new PassThrough();
      const chunks: Buffer[] = [];
      
      stream.on('data', (c: Buffer) => chunks.push(c));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      
      doc.pipe(stream);
      
      // Add text to PDF
      const text = padContent.atext?.text || '';
      doc.fontSize(11).font('Helvetica');
      
      // Split text into lines and add to PDF
      const lines = text.split('\n');
      for (const line of lines) {
        doc.text(line, { continued: false });
      }
      
      doc.end();
    });
  }

  getContentType(): string {
    return 'application/pdf';
  }

  getFileExtension(): string {
    return 'pdf';
  }
}
