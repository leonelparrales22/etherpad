import { Request, Response } from 'express';
import { SessionService } from '../services/SessionService';
import { CreateSessionDto } from '../types/session.types';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';

/**
 * Controller for session endpoints
 */
export class SessionController {
  constructor(private sessionService: SessionService) {}

  /**
   * Create a new session
   * POST /api/sessions
   */
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const { groupID, authorID, validUntil } = req.body;

      // Validate required fields
      if (!groupID || !authorID || validUntil === undefined) {
        res.status(400).json({ error: 'Missing required fields: groupID, authorID, validUntil' });
        return;
      }

      const dto: CreateSessionDto = {
        groupID,
        authorID,
        validUntil: typeof validUntil === 'string' ? parseInt(validUntil, 10) : validUntil,
      };

      const result = await this.sessionService.createSession(dto);
      res.status(201).json(result);
    } catch (error: any) {
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

  /**
   * Get session information
   * GET /api/sessions/:sessionID
   */
  async getSessionInfo(req: Request, res: Response): Promise<void> {
    try {
      const { sessionID } = req.params;
      const session = await this.sessionService.getSessionInfo(sessionID);
      res.status(200).json(session);
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a session
   * DELETE /api/sessions/:sessionID
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionID } = req.params;
      await this.sessionService.deleteSession(sessionID);
      res.status(204).send();
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * List all sessions for a group
   * GET /api/sessions/group/:groupID
   */
  async listSessionsByGroup(req: Request, res: Response): Promise<void> {
    try {
      const { groupID } = req.params;
      const sessions = await this.sessionService.listSessionsByGroup(groupID);
      res.status(200).json({ sessions });
    } catch (error) {
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * List all sessions for an author
   * GET /api/sessions/author/:authorID
   */
  async listSessionsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorID } = req.params;
      const sessions = await this.sessionService.listSessionsByAuthor(authorID);
      res.status(200).json({ sessions });
    } catch (error) {
      if (error instanceof DatabaseError) {
        res.status(500).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
