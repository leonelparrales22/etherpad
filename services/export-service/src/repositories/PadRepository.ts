import { Pool } from 'pg';
import { NotFoundError, DatabaseError } from '../errors';
import { PadContent, RevisionContent } from '../types/export.types';

/**
 * Repository for accessing pad data from the UeberDB store table
 */
export class PadRepository {
  constructor(private pool: Pool) {}

  /**
   * Get pad content from the database
   * @param padId - The pad ID
   * @param rev - Optional revision number
   * @returns The pad content
   * @throws NotFoundError if pad or revision not found
   * @throws DatabaseError if database operation fails
   */
  async getPadContent(padId: string, rev?: number): Promise<PadContent | RevisionContent> {
    const client = await this.pool.connect();
    
    try {
      const key = rev 
        ? `pad:${padId}:revs:${rev}`
        : `pad:${padId}`;

      const result = await client.query(
        'SELECT value FROM store WHERE key = $1',
        [key]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(
          rev 
            ? `Revision ${rev} not found for pad ${padId}`
            : `Pad ${padId} not found`
        );
      }

      return result.rows[0].value as PadContent | RevisionContent;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get pad content: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Check if a pad exists
   * @param padId - The pad ID
   * @returns True if the pad exists
   */
  async exists(padId: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT COUNT(*) FROM store WHERE key = $1',
        [`pad:${padId}`]
      );

      const count = parseInt(result.rows[0].count, 10);
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check pad existence: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }
}
