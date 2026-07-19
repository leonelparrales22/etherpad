import { PadContent } from '../types/export.types';

/**
 * Interface for export generators
 */
export interface ExportGenerator {
  generate(padContent: PadContent): Promise<Buffer | string>;
  getContentType(): string;
  getFileExtension(): string;
}
