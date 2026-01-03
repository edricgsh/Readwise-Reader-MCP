# Readwise Reader MCP Server

A Model Context Protocol (MCP) server for the Readwise Reader API, built with TypeScript and the official Claude SDK.

## Features

- **Secure Authentication**: Uses environment variables for token storage
- **Document Management**: Save, list, update, and delete documents with complete metadata
- **Tag Management**: List and filter by tags
- **Rich Filtering**: Filter documents by location, category, tags, and more
- **Pagination Support**: Handle large document collections
- **LLM-Friendly Content**: HTML content automatically converted to clean text using r.jina.ai
- **Complete Data Access**: Returns full document information including content, metadata, and timestamps

## API Documentation

For detailed information about the Readwise Reader API endpoints, parameters, and examples, please refer to the official API documentation:

**📖 [Readwise Reader API Documentation](https://readwise.io/reader_api)**

This MCP server implements all the core endpoints described in the official documentation.

## Installation

```bash
npm install
npm run build
```

## Configuration

### With Claude Desktop

1. Build the MCP server:
   ```bash
   npm install
   npm run build
   ```

2. Get your Readwise access token from: https://readwise.io/access_token

3. Add the server to your Claude Desktop configuration. Open your Claude Desktop settings and add this to your MCP servers configuration:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "readwise-reader": {
         "command": "node",
         "args": ["/path/to/your/reader_readwise_mcp/dist/index.js"],
         "env": {
           "READWISE_TOKEN": "your_readwise_access_token_here"
         }
       }
     }
   }
   ```

   Replace:
   - `/path/to/your/reader_readwise_mcp` with the actual path to this project directory
   - `your_readwise_access_token_here` with your actual Readwise access token

4. Restart Claude Desktop


## Available Tools

### `readwise_save_document`
Save a document (URL or HTML content) to Readwise Reader.

**Parameters:**
- `url` (required): URL of the document to save
- `html` (optional): HTML content of the document
- `tags` (optional): Array of tags to add
- `location` (optional): Location to save (`new`, `later`, `shortlist`, `archive`, `feed`)
- `category` (optional): Document category (`article`, `email`, `rss`, `highlight`, `note`, `pdf`, `epub`, `tweet`, `video`)

### `readwise_list_documents`
List documents from Readwise Reader with optional filtering. Returns complete document information including metadata and LLM-friendly text content.

**Parameters:**
- `id` (optional): Filter by specific document ID
- `updatedAfter` (optional): Filter documents updated after this date (ISO 8601)
- `location` (optional): Filter by document location
- `category` (optional): Filter by document category
- `tag` (optional): Filter by tag name
- `pageCursor` (optional): Page cursor for pagination
- `withHtmlContent` (optional): ⚠️ **PERFORMANCE WARNING**: Include HTML content in the response. This significantly slows down the API. Only use when explicitly requested by the user or when raw HTML is specifically needed for the task.
- `withFullContent` (optional): ⚠️ **PERFORMANCE WARNING**: Include full converted text content in the response. This significantly slows down the API as it fetches and processes each document's content. Only use when explicitly requested by the user or when document content is specifically needed for analysis/reading. Default: false for performance.

**Returns:**
Complete document objects with all available fields:
- `id`, `title`, `author`, `url`, `source_url`, `summary`
- `published_date`, `image_url`, `location`, `category`
- `tags`, `created_at`, `updated_at`
- `content`: LLM-friendly text content (converted from source_url or url via r.jina.ai)

### `readwise_update_document`
Update a document in Readwise Reader.

**Parameters:**
- `id` (required): Document ID to update
- `title` (optional): New title
- `author` (optional): New author
- `summary` (optional): New summary
- `published_date` (optional): New published date (ISO 8601)
- `image_url` (optional): New image URL
- `location` (optional): New location (`new`, `later`, `archive`, `feed`) - **Note:** `shortlist` is not supported for updates
- `category` (optional): New category (`article`, `email`, `rss`, `highlight`, `note`, `pdf`, `epub`, `tweet`, `video`)
- `tags` (optional): Array of tags to assign to the document

### `readwise_delete_document`
Delete a document from Readwise Reader.

**Parameters:**
- `id` (required): Document ID to delete

### `readwise_list_tags`
List all tags from Readwise Reader.

**Parameters:** None

### `readwise_topic_search`
Search documents in Readwise Reader by topic using regex matching on title, summary, notes, and tags.

**Parameters:**
- `searchTerms` (required): Array of search terms to match against document content (case-insensitive regex matching)

**Returns:**
Search results with matching documents including:
- Search terms used
- Total number of matches
- Complete document objects with all available metadata (same fields as `readwise_list_documents`)

## Authentication

The server requires a Readwise access token to be provided via the `READWISE_TOKEN` environment variable. This token is used to authenticate all API requests to Readwise Reader.

**Security Note**: The token is stored in your MCP configuration and never exposed through Claude or the tools interface.

## Rate Limits

- Default: 20 requests/minute
- Document CREATE/UPDATE: 50 requests/minute
- 429 responses include "Retry-After" header

## License

MIT