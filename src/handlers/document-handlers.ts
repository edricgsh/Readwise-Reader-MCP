import { CreateDocumentRequest, UpdateDocumentRequest, ListDocumentsParams } from '../types.js';
import { initializeClient } from '../utils/client-init.js';
import { convertUrlToText, extractTextFromHtml } from '../utils/content-converter.js';

export async function handleSaveDocument(args: any) {
  const client = initializeClient();
  const data = args as unknown as CreateDocumentRequest;
  const response = await client.createDocument(data);

  let responseText = `Document saved successfully!\nID: ${response.data.id}\nTitle: ${response.data.title || 'Untitled'}\nURL: ${response.data.url}\nLocation: ${response.data.location}`;
  
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

export async function handleListDocuments(args: any) {
  const client = initializeClient();
  const params = args as ListDocumentsParams;
  
  // If withFullContent is true, we also need HTML content
  if (params.withFullContent === true) {
    params.withHtmlContent = true;
  }
  
  let response;
  let clientSideFiltered = false;
  
  // If addedAfter is specified, we need to fetch all documents and filter client-side
  if (params.addedAfter) {
    clientSideFiltered = true;
    const addedAfterDate = new Date(params.addedAfter);
    
    // Create params without addedAfter for the API call
    const apiParams = { ...params };
    delete apiParams.addedAfter;
    
    // Fetch all documents if no other pagination is specified
    if (!apiParams.pageCursor && !apiParams.limit) {
      const allDocuments: any[] = [];
      let nextPageCursor: string | undefined;
      
      do {
        const fetchParams = { ...apiParams };
        if (nextPageCursor) {
          fetchParams.pageCursor = nextPageCursor;
        }
        
        const pageResponse = await client.listDocuments(fetchParams);
        allDocuments.push(...pageResponse.data.results);
        nextPageCursor = pageResponse.data.nextPageCursor;
      } while (nextPageCursor);
      
      // Filter documents by addedAfter date
      const filteredDocuments = allDocuments.filter(doc => {
        if (!doc.saved_at) return false;
        const savedDate = new Date(doc.saved_at);
        return savedDate > addedAfterDate;
      });
      
      response = {
        data: {
          count: filteredDocuments.length,
          nextPageCursor: undefined,
          results: filteredDocuments
        },
        messages: []
      };
    } else {
      // If pagination is specified, just do a regular API call and filter the current page
      response = await client.listDocuments(apiParams);
      const filteredDocuments = response.data.results.filter(doc => {
        if (!doc.saved_at) return false;
        const savedDate = new Date(doc.saved_at);
        return savedDate > addedAfterDate;
      });
      
      response.data.results = filteredDocuments;
      response.data.count = filteredDocuments.length;
    }
  } else {
    response = await client.listDocuments(params);
  }

  // Convert content to LLM-friendly text for documents only if withFullContent is explicitly true
  const shouldIncludeContent = params.withFullContent === true; // Default to false for performance
  const documentsWithText = await Promise.all(
    response.data.results.map(async (doc) => {
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
        reading_time: doc.reading_time,
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

      if (params.withRawSourceUrl && doc.raw_source_url) {
        result.raw_source_url = doc.raw_source_url;
      }
      
      if (shouldIncludeContent) {
        result.content = content; // LLM-friendly text content instead of raw HTML
      }
      
      if (params.withHtmlContent && doc.html_content) {
        result.html_content = doc.html_content;
      }
      
      return result;
    })
  );

  let responseText = JSON.stringify({
    count: response.data.count,
    nextPageCursor: response.data.nextPageCursor,
    documents: documentsWithText
  }, null, 2);
  
  let allMessages = response.messages || [];
  
  // Add message about client-side filtering if it was performed
  if (clientSideFiltered) {
    allMessages.push({
      type: 'info',
      content: 'Documents were filtered client-side based on the addedAfter date. All documents were fetched from the API first, then filtered by their saved_at date.'
    });
  }
  
  if (allMessages.length > 0) {
    responseText += '\n\nMessages:\n' + allMessages.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n');
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

export async function handleUpdateDocument(args: any) {
  const client = initializeClient();
  const { id, ...updateData } = args as unknown as { id: string } & UpdateDocumentRequest;
  const response = await client.updateDocument(id, updateData);

  let responseText = `Document updated successfully!\nID: ${response.data.id}\nReader URL: ${response.data.url}`;
  
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

 