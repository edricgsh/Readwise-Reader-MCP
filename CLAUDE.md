# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Run
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Run the server in development mode using tsx
- `npm run start` - Run the compiled server from `dist/index.js`

### Testing
- `npm run test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:manual` - Execute manual testing script

### Prerequisites
- Node.js >=18 required
- `READWISE_TOKEN` environment variable must be set for API access

## API Reference

**IMPORTANT**: Always check `docs/readwise-reader-api.md` before implementing or modifying any API-related code. This file contains the official Readwise Reader API documentation with endpoint specifications, parameters, and response formats.

## Architecture Overview

### Core Components

**MCP Server Setup (`src/index.ts`)**
- Entry point using `@modelcontextprotocol/sdk` with stdio transport
- Handles tool registration and request routing
- Implements error handling for all tool calls

**Readwise API Client (`src/readwise-client.ts`)**
- Centralized API client with rate limiting (20-50 req/min)
- Automatic retry-after handling for 429 responses
- Performance optimizations for bulk content fetching (limits full content to 5 docs when >5 total)
- Structured error handling with typed responses

**Tool System**
- `src/tools/tool-definitions.ts` - MCP tool schemas with validation
- `src/handlers/` - Modular request handlers:
  - `document-handlers.ts` - CRUD operations for documents
  - `tag-search-handlers.ts` - Tag listing and topic search functionality
  - `index.ts` - Router dispatching to appropriate handlers

**Content Processing (`src/utils/content-converter.ts`)**
- Integration with r.jina.ai for LLM-friendly text conversion
- HTML parsing with node-html-parser for fallback content extraction
- Conditional content conversion based on document category

### Data Flow Architecture

1. **Tool Registration**: Tools defined with JSON schemas are registered with MCP server
2. **Request Handling**: Requests routed through handler system based on tool name
3. **API Integration**: Handlers use ReadwiseClient with automatic rate limiting
4. **Content Enhancement**: Documents enriched with converted text content via jina.ai
5. **Response Formation**: Structured responses with data and optional messages

### Key Design Patterns

**Performance Considerations**
- `withFullContent` parameter triggers performance warnings and result limiting
- Content conversion is conditional based on document type
- Pagination support for large document collections

**Error Handling Strategy**
- Rate limiting with retry-after headers
- Graceful degradation for content conversion failures
- Structured error responses with context

**Type Safety**
- Comprehensive TypeScript interfaces in `src/types.ts`
- API response typing with generic `APIResponse<T>` wrapper
- Strict TypeScript configuration with ES2022 modules

## Configuration Notes

### Environment Setup
- Uses ES modules (`"type": "module"` in package.json)
- TypeScript compiled to ES2022 with Node module resolution
- Jest configured for ESM with ts-jest preset

### MCP Integration
- Implements Model Context Protocol for Claude Desktop integration
- Tools exposed: document CRUD, tag management, topic search
- Requires stdio transport configuration in Claude Desktop settings

### API Rate Limits
- 20 requests/minute (general)
- 50 requests/minute (CREATE/UPDATE operations)
- Automatic handling via client with structured error messages