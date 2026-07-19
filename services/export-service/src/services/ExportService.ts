import { PadRepository } from '../repositories/PadRepository';
import { ExportRequestDto, ExportResult, ExportType, PadContent } from '../types/export.types';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';
import { ExportGenerator } from '../generators/ExportGenerator';
import { TxtGenerator } from '../generators/TxtGenerator';
import { HtmlGenerator } from '../generators/HtmlGenerator';
import { EtherpadGenerator } from '../generators/EtherpadGenerator';
import { PdfGenerator } from '../generators/PdfGenerator';
import { DocxGenerator } from '../generators/DocxGenerator';

/**
 * Service for handling pad exports
 */
export class ExportService {
  private generators: Map<ExportType, ExportGenerator>;

  constructor(private padRepository: PadRepository) {
    // Initialize with real generators
    this.generators = new Map([
      ['txt', new TxtGenerator()],
      ['html', new HtmlGenerator()],
      ['etherpad', new EtherpadGenerator()],
      ['pdf', new PdfGenerator()],
      ['docx', new DocxGenerator()],
    ]);
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
