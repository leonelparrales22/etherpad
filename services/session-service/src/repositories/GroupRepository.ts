import { BaseRepository } from './BaseRepository';
import { DatabaseError } from '../errors';

/**
 * Repository for group data
 */
export class GroupRepository extends BaseRepository {
  /**
   * Check if a group exists
   * @param groupID - The group ID
   * @returns True if the group exists
   */
  async exists(groupID: string): Promise<boolean> {
    try {
      return await super.exists(`group:${groupID}`);
    } catch (error: any) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(`Failed to check group existence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
