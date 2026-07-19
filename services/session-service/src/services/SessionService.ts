import { SessionRepository } from '../repositories/SessionRepository';
import { GroupRepository } from '../repositories/GroupRepository';
import { AuthorRepository } from '../repositories/AuthorRepository';
import { Session, CreateSessionDto } from '../types/session.types';
import { NotFoundError, ValidationError, DatabaseError } from '../errors';
import { randomBytes } from 'crypto';

/**
 * Service for managing API sessions
 */
export class SessionService {
  constructor(
    private sessionRepository: SessionRepository,
    private groupRepository: GroupRepository,
    private authorRepository: AuthorRepository,
  ) {}

  /**
   * Create a new session
   * @param dto - The session creation data
   * @returns The session ID
   * @throws ValidationError if validation fails
   * @throws NotFoundError if group or author not found
   * @throws DatabaseError if database operation fails
   */
  async createSession(dto: CreateSessionDto): Promise<{ sessionID: string }> {
    const { groupID, authorID, validUntil } = dto;

    // Validate group exists
    const groupExists = await this.groupRepository.exists(groupID);
    if (!groupExists) {
      throw new NotFoundError(`Group ${groupID} does not exist`);
    }

    // Validate author exists
    const authorExists = await this.authorRepository.exists(authorID);
    if (!authorExists) {
      throw new NotFoundError(`Author ${authorID} does not exist`);
    }

    // Validate validUntil
    this.validateValidUntil(validUntil);

    // Generate session ID
    const sessionID = `s.${randomBytes(8).toString('hex')}`;

    // Create session
    const session: Session = {
      sessionID,
      groupID,
      authorID,
      validUntil,
    };

    try {
      // Save session
      await this.sessionRepository.save(session);

      // Update indexes
      await Promise.all([
        this.sessionRepository.addToGroupIndex(groupID, sessionID),
        this.sessionRepository.addToAuthorIndex(authorID, sessionID),
      ]);

      return { sessionID };
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get session information
   * @param sessionID - The session ID
   * @returns The session
   * @throws NotFoundError if session not found
   * @throws DatabaseError if database operation fails
   */
  async getSessionInfo(sessionID: string): Promise<Session> {
    try {
      return await this.sessionRepository.findByIdOrThrow(sessionID);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get session info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a session
   * @param sessionID - The session ID
   * @throws NotFoundError if session not found
   * @throws DatabaseError if database operation fails
   */
  async deleteSession(sessionID: string): Promise<void> {
    try {
      // Get session to extract groupID and authorID
      const session = await this.sessionRepository.findByIdOrThrow(sessionID);

      // Remove from indexes
      await Promise.all([
        this.sessionRepository.removeFromGroupIndex(session.groupID, sessionID),
        this.sessionRepository.removeFromAuthorIndex(session.authorID, sessionID),
      ]);

      // Delete session
      await this.sessionRepository.deleteById(sessionID);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all sessions for a group
   * @param groupID - The group ID
   * @returns Array of sessions
   * @throws DatabaseError if database operation fails
   */
  async listSessionsByGroup(groupID: string): Promise<Session[]> {
    try {
      return await this.sessionRepository.findByGroup(groupID);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to list sessions by group: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List all sessions for an author
   * @param authorID - The author ID
   * @returns Array of sessions
   * @throws DatabaseError if database operation fails
   */
  async listSessionsByAuthor(authorID: string): Promise<Session[]> {
    try {
      return await this.sessionRepository.findByAuthor(authorID);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to list sessions by author: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate validUntil parameter
   * @param validUntil - The timestamp to validate
   * @throws ValidationError if validation fails
   */
  private validateValidUntil(validUntil: number): void {
    // Parse if string
    let parsedValidUntil = validUntil;
    if (typeof validUntil === 'string') {
      parsedValidUntil = parseInt(validUntil, 10);
      if (isNaN(parsedValidUntil)) {
        throw new ValidationError('validUntil is not a number');
      }
    }

    // Check if negative
    if (parsedValidUntil < 0) {
      throw new ValidationError('validUntil is a negative number');
    }

    // Check if integer
    if (!Number.isInteger(parsedValidUntil)) {
      throw new ValidationError('validUntil is a float value');
    }

    // Check if in the past
    const now = Math.floor(Date.now() / 1000);
    if (parsedValidUntil < now) {
      throw new ValidationError('validUntil is in the past');
    }
  }
}
