import { ExportGenerator } from './ExportGenerator';
import { PadContent } from '../types/export.types';

/**
 * Simplified TXT generator - extracts plain text from pad
 */
export class TxtGenerator implements ExportGenerator {
  async generate(padContent: PadContent): Promise<string> {
    // Extract plain text from atext
    const text = padContent.atext?.text || '';
    // Remove trailing newline that Etherpad pads usually have
    return text.endsWith('\n') ? text.slice(0, -1) : text;
  }

  getContentType(): string {
    return 'text/plain';
  }

  getFileExtension(): string {
    return 'txt';
  }
}
