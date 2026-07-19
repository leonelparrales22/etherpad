import { Request, Response } from 'express';
import { ExportService } from '../services/ExportService';
import { ExportRequestDto, ExportType } from '../types/export.types';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';

/**
 * Controller for export endpoints
 */
export class ExportController {
  constructor(private exportService: ExportService) {}

  /**
   * Export a pad to the specified format
   * GET /api/export/:padId/:type
   * GET /api/export/:padId/:type/:rev
   */
  async exportPad(req: Request, res: Response): Promise<void> {
    try {
      const { padId, type, rev } = req.params;

      // Validate export type
      const validTypes: ExportType[] = ['html', 'txt', 'etherpad', 'pdf', 'docx'];
      if (!validTypes.includes(type as ExportType)) {
        res.status(400).json({ error: `Invalid export type '${type}'. Valid types: ${validTypes.join(', ')}` });
        return;
      }

      // Build DTO
      const dto: ExportRequestDto = {
        padId,
        type: type as ExportType,
        rev: rev ? parseInt(rev, 10) : undefined,
      };

      // Generate export
      const result = await this.exportService.generateExport(dto);

      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
      res.setHeader('Content-Type', result.contentType);

      // Send response
      if (Buffer.isBuffer(result.content)) {
        res.send(result.content);
      } else {
        res.send(result.content);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
