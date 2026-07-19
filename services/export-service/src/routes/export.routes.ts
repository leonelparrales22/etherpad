import { Router } from 'express';
import { ExportController } from '../controllers/ExportController';

/**
 * Export routes
 */
export function createExportRouter(exportController: ExportController): Router {
  const router = Router();

  // Export pad without revision
  router.get('/:padId/:type', (req, res) => exportController.exportPad(req, res));

  // Export pad with specific revision
  router.get('/:padId/:type/:rev', (req, res) => exportController.exportPad(req, res));

  return router;
}
