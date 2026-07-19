/**
 * Session types for the session service
 */

export interface Session {
  sessionID: string;
  groupID: string;
  authorID: string;
  validUntil: number;
}

export interface CreateSessionDto {
  groupID: string;
  authorID: string;
  validUntil: number;
}

export interface SessionInfo extends Session {
  // Additional metadata if needed
}

/**
 * Group2Sessions and Author2Sessions index structure
 */
export interface SessionIndex {
  sessionIDs: Record<string, number>;
}
