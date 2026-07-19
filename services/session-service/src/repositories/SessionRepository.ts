import { BaseRepository } from './BaseRepository';
import { Session, SessionIndex } from '../types/session.types';
import { NotFoundError, DatabaseError } from '../errors';

/**
 * Repository for session data
 */
export class SessionRepository extends BaseRepository {
  /**
   * Save a session to the database
   * @param session - The session to save
   */
  async save(session: Session): Promise<void> {
    try {
      await this.set(`session:${session.sessionID}`, session);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to save session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find a session by ID
   * @param sessionID - The session ID
   * @returns The session or null if not found
   */
  async findById(sessionID: string): Promise<Session | null> {
    try {
      return await this.get<Session>(`session:${sessionID}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find a session by ID or throw NotFoundError
   * @param sessionID - The session ID
   * @returns The session
   * @throws NotFoundError if session not found
   */
  async findByIdOrThrow(sessionID: string): Promise<Session> {
    const session = await this.findById(sessionID);
    if (!session) {
      throw new NotFoundError(`Session ${sessionID} not found`);
    }
    return session;
  }

  /**
   * Delete a session by ID
   * @param sessionID - The session ID
   */
  async deleteById(sessionID: string): Promise<void> {
    try {
      await this.remove(`session:${sessionID}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find all sessions for a group
   * @param groupID - The group ID
   * @returns Array of sessions
   */
  async findByGroup(groupID: string): Promise<Session[]> {
    try {
      const index = await this.get<SessionIndex>(`group2sessions:${groupID}`);
      if (!index || !index.sessionIDs) {
        return [];
      }

      const sessionIDs = Object.keys(index.sessionIDs);
      const sessions: Session[] = [];

      for (const sessionID of sessionIDs) {
        try {
          const session = await this.findById(sessionID);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          // Log but continue if a session is missing
          console.warn(`Session ${sessionID} found in group2sessions but not in store`);
        }
      }

      return sessions;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find sessions by group: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find all sessions for an author
   * @param authorID - The author ID
   * @returns Array of sessions
   */
  async findByAuthor(authorID: string): Promise<Session[]> {
    try {
      const index = await this.get<SessionIndex>(`author2sessions:${authorID}`);
      if (!index || !index.sessionIDs) {
        return [];
      }

      const sessionIDs = Object.keys(index.sessionIDs);
      const sessions: Session[] = [];

      for (const sessionID of sessionIDs) {
        try {
          const session = await this.findById(sessionID);
          if (session) {
            sessions.push(session);
          }
        } catch (error) {
          // Log but continue if a session is missing
          console.warn(`Session ${sessionID} found in author2sessions but not in store`);
        }
      }

      return sessions;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find sessions by author: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a session to the group index
   * @param groupID - The group ID
   * @param sessionID - The session ID
   */
  async addToGroupIndex(groupID: string, sessionID: string): Promise<void> {
    try {
      await this.setSub(`group2sessions:${groupID}`, ['sessionIDs', sessionID], 1);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add session to group index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a session from the group index
   * @param groupID - The group ID
   * @param sessionID - The session ID
   */
  async removeFromGroupIndex(groupID: string, sessionID: string): Promise<void> {
    try {
      await this.setSub(`group2sessions:${groupID}`, ['sessionIDs', sessionID], undefined);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to remove session from group index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add a session to the author index
   * @param authorID - The author ID
   * @param sessionID - The session ID
   */
  async addToAuthorIndex(authorID: string, sessionID: string): Promise<void> {
    try {
      await this.setSub(`author2sessions:${authorID}`, ['sessionIDs', sessionID], 1);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add session to author index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Remove a session from the author index
   * @param authorID - The author ID
   * @param sessionID - The session ID
   */
  async removeFromAuthorIndex(authorID: string, sessionID: string): Promise<void> {
    try {
      await this.setSub(`author2sessions:${authorID}`, ['sessionIDs', sessionID], undefined);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to remove session from author index: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
