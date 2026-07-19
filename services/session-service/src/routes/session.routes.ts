import { Router } from 'express';
import { SessionController } from '../controllers/SessionController';

/**
 * Session routes
 */
export function createSessionRouter(sessionController: SessionController): Router {
  const router = Router();

  // Create session
  router.post('/', (req, res) => sessionController.createSession(req, res));

  // Get session info
  router.get('/:sessionID', (req, res) => sessionController.getSessionInfo(req, res));

  // Delete session
  router.delete('/:sessionID', (req, res) => sessionController.deleteSession(req, res));

  // List sessions by group
  router.get('/group/:groupID', (req, res) => sessionController.listSessionsByGroup(req, res));

  // List sessions by author
  router.get('/author/:authorID', (req, res) => sessionController.listSessionsByAuthor(req, res));

  return router;
}
