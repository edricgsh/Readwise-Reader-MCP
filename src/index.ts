#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { parse } from 'node-html-parser';
import { ReadwiseClient } from './readwise-client.js';
import { CreateDocumentRequest, UpdateDocumentRequest, ListDocumentsParams } from './types.js';

const server = new Server(
  {
    name: 'readwise-reader-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let readwiseClient: ReadwiseClient | null = null;

// Initialize the client with token from environment or config
function initializeClient(): ReadwiseClient {
  if (readwiseClient) {
    return readwiseClient;
  }

  const token = process.env.READWISE_TOKEN;
  if (!token) {
    throw new Error('Readwise access token not provided. Please set READWISE_TOKEN in your MCP configuration or environment variables. You can get your token from https://readwise.io/access_token');
  }

  readwiseClient = new ReadwiseClient({ token });
  return readwiseClient;
}

// Convert URL content using jina.ai
async function convertWithJina(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  const response = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'User-Agent': 'Readwise-MCP-Server/1.0.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Jina conversion failed: ${response.status}`);
  }

  return response.text();
}

// Extract text content from HTML string
function extractTextFromHtml(htmlContent: string): string {
  if (!htmlContent?.trim()) {
    return '';
  }

  const root = parse(htmlContent);

  // Remove non-content elements
  root.querySelectorAll('script, style, nav, header, footer').forEach(el => el.remove());

  // Get title and body text
  const title = root.querySelector('title')?.text?.trim() || '';
  const bodyText = root.querySelector('body')?.text || root.text || '';

  // Clean up whitespace
  const cleanText = bodyText.replace(/\s+/g, ' ').trim();

  return title ? `${title}\n\n${cleanText}` : cleanText;
}

// Convert URL content to LLM-friendly text
async function convertUrlToText(url: string, category?: string): Promise<string> {
  if (!url?.trim()) {
    return '';
  }

  try {
    // Use jina for articles and PDFs, lightweight HTML parsing for others
    const shouldUseJina = !category || category === 'article' || category === 'pdf';

    if (shouldUseJina) {
      return await convertWithJina(url);
    } else {
      // For non-article/pdf content, we'll rely on HTML content from Readwise
      // This function is now mainly used as a fallback
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Readwise-MCP-Server/1.0.0',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTML fetch failed: ${response.status}`);
      }

      const html = await response.text();
      return extractTextFromHtml(html);
    }
  } catch (error) {
    console.warn('Error converting URL to text:', error);
    return '[Content unavailable - conversion error]';
  }
}

const tools: Tool[] = [
  {
    name: 'readwise_save_document',
    description: 'Save a document (URL or HTML content) to Readwise Reader',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the document to save',
        },
        html: {
          type: 'string',
          description: 'HTML content of the document (optional)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to add to the document',
        },
        location: {
          type: 'string',
          enum: ['new', 'later', 'shortlist', 'archive', 'feed'],
          description: 'Location to save the document (default: new)',
        },
        category: {
          type: 'string',
          enum: ['article', 'book', 'tweet', 'pdf', 'email', 'youtube', 'podcast'],
          description: 'Category of the document (auto-detected if not specified)',
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
        location: {
          type: 'string',
          enum: ['new', 'later', 'shortlist', 'archive', 'feed'],
          description: 'Filter by document location',
        },
        category: {
          type: 'string',
          enum: ['article', 'book', 'tweet', 'pdf', 'email', 'youtube', 'podcast'],
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
          description: '⚠️ PERFORMANCE WARNING: Include HTML content in the response. This significantly slows down the API. Only use when explicitly requested by the user or when raw HTML is specifically needed for the task.',
        },
        withFullContent: {
          type: 'boolean',
          description: '⚠️ PERFORMANCE WARNING: Include full converted text content in the response. This significantly slows down the API as it fetches and processes each document\'s content. Only use when explicitly requested by the user or when document content is specifically needed for analysis/reading. Default: false for performance.',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_update_document',
    description: 'Update a document in Readwise Reader',
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
          description: 'New published date (ISO 8601)',
        },
        image_url: {
          type: 'string',
          description: 'New image URL for the document',
        },
        location: {
          type: 'string',
          enum: ['new', 'later', 'shortlist', 'archive', 'feed'],
          description: 'New location for the document',
        },
        category: {
          type: 'string',
          enum: ['article', 'book', 'tweet', 'pdf', 'email', 'youtube', 'podcast'],
          description: 'New category for the document',
        },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'readwise_delete_document',
    description: 'Delete a document from Readwise Reader',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Document ID to delete',
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
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'readwise_save_document': {
        const client = initializeClient();

        const data = args as unknown as CreateDocumentRequest;
        const document = await client.createDocument(data);

        return {
          content: [
            {
              type: 'text',
              text: `Document saved successfully!\nID: ${document.id}\nTitle: ${document.title || 'Untitled'}\nURL: ${document.url}\nLocation: ${document.location}`,
            },
          ],
        };
      }

      case 'readwise_list_documents': {
        const client = initializeClient();
        const params = args as ListDocumentsParams;

        // If withFullContent is true, we also need HTML content
        if (params.withFullContent === true) {
          params.withHtmlContent = true;
        }

        const response = await client.listDocuments(params);

        // Convert content to LLM-friendly text for documents only if withFullContent is explicitly true
        const shouldIncludeContent = params.withFullContent === true; // Default to false for performance
        const documentsWithText = await Promise.all(
          response.results.map(async (doc) => {
            let content = '';
            if (shouldIncludeContent) {
              // Try to use HTML content first (from Readwise), fallback to URL fetching
              if (doc.html_content) {
                // Use HTML content from Readwise for non-jina content types
                const shouldUseJina = !doc.category || doc.category === 'article' || doc.category === 'pdf';
                if (shouldUseJina) {
                  const urlToConvert = doc.source_url || doc.url;
                  if (urlToConvert) {
                    content = await convertUrlToText(urlToConvert, doc.category);
                  }
                } else {
                  content = extractTextFromHtml(doc.html_content);
                }
              } else {
                // Fallback to URL fetching if no HTML content available
                const urlToConvert = doc.source_url || doc.url;
                if (urlToConvert) {
                  content = await convertUrlToText(urlToConvert, doc.category);
                }
              }
            }

            const result: any = {
              id: doc.id,
              url: doc.url,
              title: doc.title,
              author: doc.author,
              source: doc.source,
              category: doc.category,
              location: doc.location,
              tags: doc.tags,
              site_name: doc.site_name,
              word_count: doc.word_count,
              created_at: doc.created_at,
              updated_at: doc.updated_at,
              published_date: doc.published_date,
              summary: doc.summary,
              image_url: doc.image_url,
              source_url: doc.source_url,
              notes: doc.notes,
              parent_id: doc.parent_id,
              reading_progress: doc.reading_progress,
              first_opened_at: doc.first_opened_at,
              last_opened_at: doc.last_opened_at,
              saved_at: doc.saved_at,
              last_moved_at: doc.last_moved_at,
            };

            if (shouldIncludeContent) {
              result.content = content; // LLM-friendly text content instead of raw HTML
            }

            if (params.withHtmlContent && doc.html_content) {
              result.html_content = doc.html_content;
            }

            return result;
          })
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: response.count,
                nextPageCursor: response.nextPageCursor,
                documents: documentsWithText
              }, null, 2),
            },
          ],
        };
      }

      case 'readwise_update_document': {
        const client = initializeClient();
        const { id, ...updateData } = args as unknown as { id: string } & UpdateDocumentRequest;
        const document = await client.updateDocument(id, updateData);

        return {
          content: [
            {
              type: 'text',
              text: `Document updated successfully!\nID: ${document.id}\nReader URL: ${document.url}`,
            },
          ],
        };
      }

      case 'readwise_delete_document': {
        const client = initializeClient();
        const { id } = args as { id: string };
        await client.deleteDocument(id);

        return {
          content: [
            {
              type: 'text',
              text: `Document ${id} deleted successfully!`,
            },
          ],
        };
      }

      case 'readwise_list_tags': {
        const client = initializeClient();
        const tags = await client.listTags();
        const tagsText = tags.map(tag => `- ${tag.name}`).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Available tags:\n${tagsText}`,
            },
          ],
        };
      }

      case 'readwise_topic_search': {
        const client = initializeClient();
        const { searchTerms } = args as { searchTerms: string[] };

        const matchingDocuments = await client.searchDocumentsByTopic(searchTerms);

        const searchResults = {
          searchTerms,
          totalMatches: matchingDocuments.length,
          documents: matchingDocuments.map(doc => ({
            id: doc.id,
            url: doc.url,
            title: doc.title,
            author: doc.author,
            source: doc.source,
            category: doc.category,
            location: doc.location,
            tags: doc.tags,
            site_name: doc.site_name,
            word_count: doc.word_count,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            published_date: doc.published_date,
            summary: doc.summary,
            image_url: doc.image_url,
            source_url: doc.source_url,
            notes: doc.notes,
            reading_progress: doc.reading_progress,
            first_opened_at: doc.first_opened_at,
            last_opened_at: doc.last_opened_at,
            saved_at: doc.saved_at,
            last_moved_at: doc.last_moved_at,
          }))
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(searchResults, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});