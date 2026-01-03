export interface ReadwiseDocument {
  id: string;
  url: string;
  source_url?: string;
  title?: string;
  author?: string;
  source?: string;
  summary?: string;
  published_date?: string | number;
  image_url?: string;
  location: 'new' | 'later' | 'shortlist' | 'archive' | 'feed';
  category?: 'article' | 'email' | 'rss' | 'highlight' | 'note' | 'pdf' | 'epub' | 'tweet' | 'video';
  tags?: string[] | object;
  site_name?: string;
  word_count?: number | null;
  reading_time?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  parent_id?: string | null;
  reading_progress?: number;
  first_opened_at?: string | null;
  last_opened_at?: string | null;
  saved_at?: string;
  last_moved_at?: string;
  html_content?: string;
  raw_source_url?: string;
}

export interface CreateDocumentRequest {
  url: string;
  html?: string;
  should_clean_html?: boolean;
  title?: string;
  author?: string;
  summary?: string;
  published_date?: string;
  image_url?: string;
  location?: 'new' | 'later' | 'archive' | 'feed';
  category?: 'article' | 'email' | 'rss' | 'highlight' | 'note' | 'pdf' | 'epub' | 'tweet' | 'video';
  saved_using?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  author?: string;
  summary?: string;
  published_date?: string;
  image_url?: string;
  seen?: boolean;
  location?: 'new' | 'later' | 'archive' | 'feed';
  category?: 'article' | 'email' | 'rss' | 'highlight' | 'note' | 'pdf' | 'epub' | 'tweet' | 'video';
  tags?: string[];
}

export interface ListDocumentsParams {
  id?: string;
  updatedAfter?: string;
  addedAfter?: string;
  location?: 'new' | 'later' | 'shortlist' | 'archive' | 'feed';
  category?: 'article' | 'email' | 'rss' | 'highlight' | 'note' | 'pdf' | 'epub' | 'tweet' | 'video';
  tag?: string;
  pageCursor?: string;
  withHtmlContent?: boolean;
  withRawSourceUrl?: boolean;
  withFullContent?: boolean;
  limit?: number;
}

export interface ListDocumentsResponse {
  count: number;
  nextPageCursor?: string;
  results: ReadwiseDocument[];
}

export interface ListTagsResponse {
  count: number;
  nextPageCursor?: string;
  results: ReadwiseTag[];
}

export interface ReadwiseTag {
  key: string;
  name: string;
}

export interface ReadwiseConfig {
  token: string;
}

export interface APIMessage {
  type: 'info' | 'warning' | 'error';
  content: string;
}

export interface APIResponse<T> {
  data: T;
  messages?: APIMessage[];
}