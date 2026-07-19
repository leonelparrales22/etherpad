import { Pool } from 'pg';
import { DatabaseError } from '../errors';

/**
 * Base repository with common database operations
 */
export abstract class BaseRepository {
  constructor(protected pool: Pool) {}

  /**
   * Get a value from the store by key
   * @param key - The store key
   * @returns The value or null if not found
   */
  protected async get<T>(key: string): Promise<T | null> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT value FROM store WHERE key = $1',
        [key]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0].value as T;
    } catch (error: any) {
      throw new DatabaseError(`Failed to get value: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Set a value in the store by key (upsert)
   * @param key - The store key
   * @param value - The value to store
   */
  protected async set(key: string, value: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        'INSERT INTO store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, value]
      );
    } catch (error) {
      throw new DatabaseError(`Failed to set value: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Remove a value from the store by key
   * @param key - The store key
   */
  protected async remove(key: string): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query(
        'DELETE FROM store WHERE key = $1',
        [key]
      );
    } catch (error) {
      throw new DatabaseError(`Failed to remove value: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Check if a key exists in the store
   * @param key - The store key
   * @returns True if the key exists
   */
  protected async exists(key: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        'SELECT COUNT(*) FROM store WHERE key = $1',
        [key]
      );

      const count = parseInt(result.rows[0].count, 10);
      return count > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check existence: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update a nested property in a JSONB value
   * @param key - The store key
   * @param path - The path to the property (array of keys)
   * @param value - The value to set (use undefined to delete)
   */
  protected async setSub(key: string, path: string[], value: any): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      if (value === undefined) {
        // Delete the property
        await client.query(
          `UPDATE store SET value = value #- $1 WHERE key = $2`,
          [`{${path.join(',')}}`, key]
        );
      } else {
        // Set the property
        await client.query(
          `UPDATE store SET value = jsonb_set(value, $1, $2, true) WHERE key = $3`,
          [`{${path.join(',')}}`, JSON.stringify(value), key]
        );
      }
    } catch (error) {
      throw new DatabaseError(`Failed to set sub value: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }
}
