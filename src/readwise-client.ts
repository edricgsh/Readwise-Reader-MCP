import {
  ReadwiseDocument,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  ListDocumentsParams,
  ListDocumentsResponse,
  ListTagsResponse,
  ReadwiseTag,
  ReadwiseConfig,
  APIResponse,
  APIMessage
} from './types.js';

export class ReadwiseClient {
  private readonly baseUrl = 'https://readwise.io/api/v3';
  private readonly authUrl = 'https://readwise.io/api/v2/auth/';
  private readonly token: string;

  constructor(config: ReadwiseConfig) {
    this.token = config.token;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Token ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new Error(`RATE_LIMIT:${retryAfterSeconds}`);
      }
      
      const errorText = await response.text();
      throw new Error(`Readwise API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  private createResponse<T>(data: T, messages?: APIMessage[]): APIResponse<T> {
    return { data, messages };
  }

  private createInfoMessage(content: string): APIMessage {
    return { type: 'info', content };
  }

  private createErrorMessage(content: string): APIMessage {
    return { type: 'error', content };
  }

  async validateAuth(): Promise<APIResponse<{ detail: string }>> {
    try {
      const result = await this.makeRequest<{ detail: string }>(this.authUrl);
      return this.createResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }

  async createDocument(data: CreateDocumentRequest): Promise<APIResponse<ReadwiseDocument>> {
    try {
      const result = await this.makeRequest<ReadwiseDocument>('/save/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return this.createResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }

  async listDocuments(params: ListDocumentsParams = {}): Promise<APIResponse<ListDocumentsResponse>> {
    try {
      // If withFullContent is requested, first check the document count
      if (params.withFullContent) {
        const countParams = { ...params };
        delete countParams.withFullContent;
        delete countParams.withHtmlContent; // Also remove HTML content for the count check
        
        const countSearchParams = new URLSearchParams();
        Object.entries(countParams).forEach(([key, value]) => {
          if (value !== undefined) {
            countSearchParams.append(key, String(value));
          }
        });

        const countQuery = countSearchParams.toString();
        const countEndpoint = `/list/${countQuery ? `?${countQuery}` : ''}`;
        
        const countResponse = await this.makeRequest<ListDocumentsResponse>(countEndpoint);
        
        if (countResponse.count > 5) {
          // Get first 5 documents with full content
          const limitedParams = { ...params, limit: 5 };
          const searchParams = new URLSearchParams();
          
          Object.entries(limitedParams).forEach(([key, value]) => {
            if (value !== undefined) {
              searchParams.append(key, String(value));
            }
          });

          const query = searchParams.toString();
          const endpoint = `/list/${query ? `?${query}` : ''}`;
          
          const result = await this.makeRequest<ListDocumentsResponse>(endpoint);
          
          let message: APIMessage;
          if (countResponse.count <= 20) {
            message = this.createInfoMessage(
              `Found ${countResponse.count} documents, but only returning the first 5 due to full content request. ` +
              `To get the remaining ${countResponse.count - 5} documents with full content, ` +
              `you can fetch them individually by their IDs using the update/read document API.`
            );
          } else {
            message = this.createErrorMessage(
              `Found ${countResponse.count} documents, but only returning the first 5 due to full content request. ` +
              `Getting full content for more than 20 documents is not supported due to performance limitations.`
            );
          }
          
          return this.createResponse(result, [message]);
        }
      }

      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });

      const query = searchParams.toString();
      const endpoint = `/list/${query ? `?${query}` : ''}`;
      
      const result = await this.makeRequest<ListDocumentsResponse>(endpoint);
      return this.createResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }

  async updateDocument(id: string, data: UpdateDocumentRequest): Promise<APIResponse<ReadwiseDocument>> {
    try {
      const result = await this.makeRequest<ReadwiseDocument>(`/update/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      return this.createResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }

  async listTags(): Promise<APIResponse<ReadwiseTag[]>> {
    try {
      const result = await this.makeRequest<ListTagsResponse>('/tags/');
      return this.createResponse(result.results);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }

  async searchDocumentsByTopic(searchTerms: string[]): Promise<APIResponse<ReadwiseDocument[]>> {
    try {
      // Fetch all documents without full content for performance
      const allDocuments: ReadwiseDocument[] = [];
      let nextPageCursor: string | undefined;
      
      do {
        const params: ListDocumentsParams = {
          withFullContent: false,
          withHtmlContent: false,
        };
        
        if (nextPageCursor) {
          params.pageCursor = nextPageCursor;
        }
        
        const response = await this.listDocuments(params);
        allDocuments.push(...response.data.results);
        nextPageCursor = response.data.nextPageCursor;
      } while (nextPageCursor);

      // Create regex patterns from search terms (case-insensitive)
      const regexPatterns = searchTerms.map(term => 
        new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      );

      // Filter documents that match any of the search terms
      const matchingDocuments = allDocuments.filter(doc => {
        // Extract searchable text fields
        const searchableFields = [
          doc.title || '',
          doc.summary || '',
          doc.notes || '',
          // Handle tags - they can be string array or object
          Array.isArray(doc.tags) ? doc.tags.join(' ') : '',
        ];

        const searchableText = searchableFields.join(' ').toLowerCase();

        // Check if any regex pattern matches
        return regexPatterns.some(pattern => pattern.test(searchableText));
      });

      return this.createResponse(matchingDocuments);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('RATE_LIMIT:')) {
        const seconds = parseInt(error.message.split(':')[1], 10);
        throw new Error(`Rate limit exceeded. Too many requests. Please retry after ${seconds} seconds.`);
      }
      throw error;
    }
  }
}