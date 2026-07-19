/**
 * Export types for the export service
 */

export type ExportType = 'html' | 'txt' | 'etherpad' | 'pdf' | 'docx';

export interface ExportRequestDto {
  padId: string;
  type: ExportType;
  rev?: number;
}

export interface ExportResult {
  content: Buffer | string;
  fileName: string;
  contentType: string;
}

/**
 * Pad content structure from UeberDB
 * This is a simplified version of the actual pad structure
 */
export interface PadContent {
  atext: {
    text: string;
    attribs: string;
  };
  apool: any;
  head: number;
  chatHead: number;
}

/**
 * Revision content structure
 */
export interface RevisionContent {
  atext: {
    text: string;
    attribs: string;
  };
}
