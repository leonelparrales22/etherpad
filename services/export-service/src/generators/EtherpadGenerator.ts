import { ExportGenerator } from './ExportGenerator';
import { PadContent } from '../types/export.types';

/**
 * Etherpad format generator - serializes pad to JSON
 */
export class EtherpadGenerator implements ExportGenerator {
  async generate(padContent: PadContent): Promise<string> {
    // Serialize the entire pad content to JSON
    return JSON.stringify(padContent, null, 2);
  }

  getContentType(): string {
    return 'application/json';
  }

  getFileExtension(): string {
    return 'etherpad';
  }
}
