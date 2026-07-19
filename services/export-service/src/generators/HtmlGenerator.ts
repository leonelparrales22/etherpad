import { ExportGenerator } from './ExportGenerator';
import { PadContent } from '../types/export.types';

/**
 * Simplified HTML generator - wraps text in basic HTML structure
 */
export class HtmlGenerator implements ExportGenerator {
  async generate(padContent: PadContent): Promise<string> {
    const text = padContent.atext?.text || '';
    // Escape HTML special characters
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // Wrap in pre tag to preserve formatting
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pad Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <pre>${escapedText}</pre>
</body>
</html>`;
  }

  getContentType(): string {
    return 'text/html';
  }

  getFileExtension(): string {
    return 'html';
  }
}
