// Search types for file matching

export interface FileMatch {
  path: string;           // Full path: "BUSINESS/Project-Notes.md"
  score: number;          // 0-1 similarity score
  matchType: 'exact' | 'contains' | 'fuzzy';
}

export interface SearchOptions {
  query: string;
  maxResults?: number;    // Default: 10
  fuzzy?: boolean;        // Default: false
}
