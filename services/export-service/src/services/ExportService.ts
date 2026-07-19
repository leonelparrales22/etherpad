import { PadRepository } from '../repositories/PadRepository';
import { ExportRequestDto, ExportResult, ExportType, PadContent } from '../types/export.types';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';

/**
 * Interface for export generators (to be implemented in Step 7)
 */
export interface ExportGenerator {
  generate(padContent: PadContent): Promise<Buffer | string>;
  getContentType(): string;
  getFileExtension(): string;
}

/**
 * Placeholder generator for development
 */
class PlaceholderGenerator implements ExportGenerator {
  constructor(private type: ExportType) {}

  async generate(padContent: PadContent): Promise<string> {
    return `Placeholder export for ${this.type}. Pad content: ${JSON.stringify(padContent).substring(0, 100)}...`;
  }

  getContentType(): string {
    const contentTypes: Record<ExportType, string> = {
      html: 'text/html',
      txt: 'text/plain',
      etherpad: 'application/json',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return contentTypes[this.type];
  }

  getFileExtension(): string {
    return this.type;
  }
}

/**
 * Service for handling pad exports
 */
export class ExportService {
  private generators: Map<ExportType, ExportGenerator>;

  constructor(private padRepository: PadRepository) {
    // Initialize with placeholder generators (will be replaced in Step 7)
    this.generators = new Map();
    const exportTypes: ExportType[] = ['html', 'txt', 'etherpad', 'pdf', 'docx'];
    for (const type of exportTypes) {
      this.generators.set(type, new PlaceholderGenerator(type));
    }
  }

  /**
   * Generate an export for a pad
   * @param dto - The export request
   * @returns The export result
   * @throws NotFoundError if pad not found
   * @throws ValidationError if export type is not supported
   * @throws DatabaseError if database operation fails
   */
  async generateExport(dto: ExportRequestDto): Promise<ExportResult> {
    const { padId, type, rev } = dto;

    // Validate export type
    if (!this.generators.has(type)) {
      throw new ValidationError(`Export type '${type}' is not supported`);
    }

    // Get pad content
    let padContent: PadContent;
    try {
      padContent = await this.padRepository.getPadContent(padId, rev) as PadContent;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get pad content: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Get generator
    const generator = this.generators.get(type)!;

    // Generate export
    let content: Buffer | string;
    try {
      content = await generator.generate(padContent);
    } catch (error) {
      throw new DatabaseError(`Failed to generate export: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Build file name
    const fileName = `${padId}${rev ? `-rev${rev}` : ''}.${generator.getFileExtension()}`;

    return {
      content,
      fileName,
      contentType: generator.getContentType(),
    };
  }

  /**
   * Register a custom generator (for extensibility)
   * @param type - The export type
   * @param generator - The generator implementation
   */
  registerGenerator(type: ExportType, generator: ExportGenerator): void {
    this.generators.set(type, generator);
  }
}
