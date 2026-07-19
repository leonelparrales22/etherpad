import { BaseRepository } from './BaseRepository';
import { DatabaseError } from '../errors';

/**
 * Repository for author data
 */
export class AuthorRepository extends BaseRepository {
  /**
   * Check if an author exists
   * @param authorID - The author ID
   * @returns True if the author exists
   */
  async exists(authorID: string): Promise<boolean> {
    try {
      return await this.exists(`author:${authorID}`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to check author existence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
