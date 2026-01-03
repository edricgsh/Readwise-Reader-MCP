import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const tools: Tool[] = [
  {
    name: 'readwise_save_document',
    description: 'Save a document (URL or HTML content) to Readwise Reader',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the document to save. If you don\'t have one, provide a made up value such as https://yourapp.com#document1',
        },
        html: {
          type: 'string',
          description: 'HTML content of the document. If not provided, Readwise will try to scrape the URL.',
        },
        should_clean_html: {
          type: 'boolean',
          description: 'Only valid when html is provided. Pass true to have Readwise automatically clean the HTML and parse the metadata (title/author). Default: false.',
        },
        title: {
          type: 'string',
          description: 'Document title. Will overwrite the original title.',
        },
        author: {
          type: 'string',
          description: 'Document author. Will overwrite the original author if found during parsing.',
        },
        summary: {
          type: 'string',
          description: 'Summary of the document.',
        },
        published_date: {
          type: 'string',
          description: 'Published date in ISO 8601 format (e.g., "2020-07-14T20:11:24+00:00"). Default timezone is UTC.',
        },
        image_url: {
          type: 'string',
          description: 'Image URL to use as cover image.',
        },
        location: {
          type: 'string',
          enum: ['new', 'later', 'archive', 'feed'],
          description: 'Location to save the document (default: new). Note: if the user doesn\'t have the location enabled, it will be set to their default.',
        },
        category: {
          type: 'string',
          enum: ['article', 'email', 'rss', 'highlight', 'note', 'pdf', 'epub', 'tweet', 'video'],
          description: 'Category of the document (auto-detected based on URL if not specified, usually article).',
        },
        saved_using: {
          type: 'string',
          description: 'Source of the document (e.g., app name or integration).',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the document (e.g., ["tag1", "tag2"]).',
        },
        notes: {
          type: 'string',
          description: 'Top-level note for the document.',
        },
      },
      required: ['url'],
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_list_documents',
    description: 'List documents from Readwise Reader with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Filter by specific document ID',
        },
        updatedAfter: {
          type: 'string',
          description: 'Filter documents updated after this date (ISO 8601)',
        },
        addedAfter: {
          type: 'string',
          description: 'Filter documents added after this date (ISO 8601). Note: This will fetch all documents first and then filter client-side.',
        },
        location: {
          type: 'string',
          enum: ['new', 'later', 'shortlist', 'archive', 'feed'],
          description: 'Filter by document location',
        },
        category: {
          type: 'string',
          enum: ['article', 'email', 'rss', 'highlight', 'note', 'pdf', 'epub', 'tweet', 'video'],
          description: 'Filter by document category',
        },
        tag: {
          type: 'string',
          description: 'Filter by tag name',
        },
        pageCursor: {
          type: 'string',
          description: 'Page cursor for pagination',
        },
        withHtmlContent: {
          type: 'boolean',
          description: '⚠️ PERFORMANCE WARNING: Include HTML content in the response. This may slightly increase request processing time.',
        },
        withRawSourceUrl: {
          type: 'boolean',
          description: 'Include a direct Amazon S3 link to the raw document source file (valid for 1 hour). Empty for non-distributable documents. May slightly increase request processing time.',
        },
        withFullContent: {
          type: 'boolean',
          description: '⚠️ PERFORMANCE WARNING: Include full converted text content in the response. This significantly slows down the API as it fetches and processes each document\'s content via jina.ai. Only use when document content is specifically needed. Default: false.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_update_document',
    description: 'Update a document in Readwise Reader. Fields omitted from the request will remain unchanged.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Document ID to update',
        },
        title: {
          type: 'string',
          description: 'New title for the document',
        },
        author: {
          type: 'string',
          description: 'New author for the document',
        },
        summary: {
          type: 'string',
          description: 'New summary for the document',
        },
        published_date: {
          type: 'string',
          description: 'New published date in ISO 8601 format (e.g., "2020-07-14T20:11:24+00:00"). Default timezone is UTC.',
        },
        image_url: {
          type: 'string',
          description: 'New image URL for the document cover',
        },
        seen: {
          type: 'boolean',
          description: 'Mark the document as seen/unseen. Setting true will populate first_opened_at/last_opened_at; setting false will clear them.',
        },
        location: {
          type: 'string',
          enum: ['new', 'later', 'archive', 'feed'],
          description: 'New location for the document. Note: if the user doesn\'t have the location enabled, it will be set to their default.',
        },
        category: {
          type: 'string',
          enum: ['article', 'email', 'rss', 'highlight', 'note', 'pdf', 'epub', 'tweet', 'video'],
          description: 'New category for the document',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to assign to the document (e.g., ["tag1", "tag2"])',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_list_tags',
    description: 'List all tags from Readwise Reader',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_topic_search',
    description: 'Search documents in Readwise Reader by topic using regex matching on title, summary, notes, and tags',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerms: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of search terms to match against document content (case-insensitive regex matching)',
          minItems: 1,
        },
      },
      required: ['searchTerms'],
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_update_document_tags',
    description: 'Update tags for a single document. Only modifies tags, leaving all other document properties unchanged.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Document ID to update tags for',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to apply to the document (e.g., ["tag1", "tag2"])',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'add'],
          description: 'Mode of operation: "replace" replaces all existing tags, "add" adds to existing tags. Default: "replace"',
        },
      },
      required: ['id', 'tags'],
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_bulk_update_tags',
    description: 'Update tags for multiple documents at once. Only modifies tags, leaving all other document properties unchanged.',
    inputSchema: {
      type: 'object',
      properties: {
        documentIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of document IDs to update tags for',
          minItems: 1,
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to apply to all specified documents (e.g., ["tag1", "tag2"])',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'add'],
          description: 'Mode of operation: "replace" replaces all existing tags, "add" adds to existing tags. Default: "replace"',
        },
      },
      required: ['documentIds', 'tags'],
      additionalProperties: false,
    },
  },
]; 