import {
  handleSaveDocument,
  handleListDocuments,
  handleUpdateDocument
} from './document-handlers.js';
import {
  handleListTags,
  handleTopicSearch,
  handleUpdateDocumentTags,
  handleBulkUpdateTags
} from './tag-search-handlers.js';

export async function handleToolCall(name: string, args: any) {
  switch (name) {
    case 'readwise_save_document':
      return handleSaveDocument(args);

    case 'readwise_list_documents':
      return handleListDocuments(args);

    case 'readwise_update_document':
      return handleUpdateDocument(args);

    case 'readwise_list_tags':
      return handleListTags(args);

    case 'readwise_topic_search':
      return handleTopicSearch(args);

    case 'readwise_update_document_tags':
      return handleUpdateDocumentTags(args);

    case 'readwise_bulk_update_tags':
      return handleBulkUpdateTags(args);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
} 