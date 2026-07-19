import { ExportGenerator } from './ExportGenerator';
import { PadContent } from '../types/export.types';
import htmlDocx from 'html-to-docx';

/**
 * DOCX generator - converts HTML to DOCX using html-to-docx
 */
export class DocxGenerator implements ExportGenerator {
  async generate(padContent: PadContent): Promise<Buffer> {
    // First generate HTML
    const text = padContent.atext?.text || '';
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <p>${escapedText.replace(/\n/g, '<br>')}</p>
</body>
</html>`;

    // Convert HTML to DOCX
    const docxBuffer = await htmlDocx(html);
    return docxBuffer as Buffer;
  }

  getContentType(): string {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  getFileExtension(): string {
    return 'docx';
  }
}
