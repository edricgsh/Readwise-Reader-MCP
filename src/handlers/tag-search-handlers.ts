import { initializeClient } from '../utils/client-init.js';

interface UpdateTagsArgs {
  id: string;
  tags: string[];
  mode?: 'replace' | 'add';
}

interface BulkUpdateTagsArgs {
  documentIds: string[];
  tags: string[];
  mode?: 'replace' | 'add';
}

// Helper function to extract tags from document (handles both array and object formats)
function extractTags(tags: string[] | object | undefined): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  // Handle object format like {"tag-key": "Tag Name"}
  return Object.values(tags as Record<string, string>);
}

export async function handleListTags(args: any) {
  const client = initializeClient();
  const response = await client.listTags();
  const tagsText = response.data.map((tag: any) => `- ${tag.name}`).join('\n');

  let responseText = `Available tags:\n${tagsText}`;
  
  if (response.messages && response.messages.length > 0) {
    responseText += '\n\nMessages:\n' + response.messages.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n');
  }

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
  };
}

export async function handleTopicSearch(args: any) {
  const client = initializeClient();
  const { searchTerms } = args as { searchTerms: string[] };

  const response = await client.searchDocumentsByTopic(searchTerms);

  const searchResults = {
    searchTerms,
    totalMatches: response.data.length,
    documents: response.data.map((doc: any) => ({
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

  let responseText = JSON.stringify(searchResults, null, 2);

  if (response.messages && response.messages.length > 0) {
    responseText += '\n\nMessages:\n' + response.messages.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n');
  }

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
  };
}

export async function handleUpdateDocumentTags(args: any) {
  const client = initializeClient();
  const { id, tags, mode = 'replace' } = args as UpdateTagsArgs;

  let finalTags = tags;

  if (mode === 'add') {
    // Fetch existing document to get current tags
    const docResponse = await client.listDocuments({ id });
    if (docResponse.data.results.length === 0) {
      throw new Error(`Document with ID ${id} not found`);
    }
    const existingTags = extractTags(docResponse.data.results[0].tags);
    // Merge and deduplicate tags
    finalTags = [...new Set([...existingTags, ...tags])];
  }

  await client.updateDocument(id, { tags: finalTags });

  return {
    content: [
      {
        type: 'text',
        text: `Tags updated successfully for document ${id}!\nMode: ${mode}\nTags: ${finalTags.join(', ')}`,
      },
    ],
  };
}

export async function handleBulkUpdateTags(args: any) {
  const client = initializeClient();
  const { documentIds, tags, mode = 'replace' } = args as BulkUpdateTagsArgs;

  const results: { id: string; success: boolean; tags?: string[]; error?: string }[] = [];

  for (const id of documentIds) {
    try {
      let finalTags = tags;

      if (mode === 'add') {
        // Fetch existing document to get current tags
        const docResponse = await client.listDocuments({ id });
        if (docResponse.data.results.length === 0) {
          results.push({ id, success: false, error: 'Document not found' });
          continue;
        }
        const existingTags = extractTags(docResponse.data.results[0].tags);
        finalTags = [...new Set([...existingTags, ...tags])];
      }

      await client.updateDocument(id, { tags: finalTags });
      results.push({ id, success: true, tags: finalTags });
    } catch (error) {
      results.push({
        id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          summary: {
            total: documentIds.length,
            successful,
            failed,
            mode,
            tagsApplied: tags,
          },
          results,
        }, null, 2),
      },
    ],
  };
} 