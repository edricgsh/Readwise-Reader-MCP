# Reader API | Readwise
The Reader API just supports saving new documents to Reader and fetching your documents. We will add more endpoints in the near future. If you have any questions, please [reach out :)](mailto:api@readwise.io)  
Looking for the API docs for the original Readwise? [See here.](https://readwise.io/api_deets)

Authentication
--------------

Set a header with key "Authorization" and value: "Token XXX" where XXX is your Readwise access token. You (or your users) can get that from here: [readwise.io/access\_token](https://readwise.io/access_token)

If you want to check that a token is valid, just make a GET request to `https://readwise.io/api/v2/auth/` with the above header. You should receive a `204` response.

Document CREATE
---------------

**Request**: `POST` to `https://readwise.io/api/v3/save/`

**Parameters:** A JSON object with the following keys:



* Key: url
  * Type: string
  * Description: The document's unique URL. If you don't have one, you can provide a made up value such as https://yourapp.com#document1
  * Required: yes
* Key: html
  * Type: string
  * Description: The document's content, in valid html (see examples). If you don't provide this, we will try to scrape the URL you provided to fetch html from the open web.
  * Required: no
* Key: should_clean_html
  * Type: boolean
  * Description: Only valid when html is provided. Pass true to have us automatically clean the html and parse the metadata (title/author) of the document for you. By default, this option is false.
  * Required: no
* Key: title
  * Type: string
  * Description: The document's title, it will overwrite the original title of the document                                        
  * Required: no
* Key: author
  * Type: string
  * Description: The document's author, it will overwrite the original author (if found                                            during the parsing step)                                        
  * Required: no
* Key: summary
  * Type: string
  * Description: Summary of the document
  * Required: no
* Key: published_date
  * Type: date
  * Description: A datetime representing when the document was published in the ISO 8601                                            format;                                            default timezone is UTC.Example:                                            "2020-07-14T20:11:24+00:00"
  * Required: no
* Key: image_url
  * Type: string
  * Description: An image URL to use as cover image
  * Required: no
* Key: location
  * Type: string
  * Description: One of: new, later, archive or feed. Default                                            is                                            new. Represents the initial location of the document (previously called triage_status).                                            Note: if you try to use a location the user doesn't have enabled in their settings, this value will be set to their default location.                                        
  * Required: no
* Key: category
  * Type: string
  * Description: One of: article, email, rss, highlight, note, pdf,epub, tweet or video. Default is guessed based on the URL, usually article.                                        
  * Required: no
* Key: saved_using
  * Type: string
  * Description: This value represents the source of the document
  * Required: no
* Key: tags
  * Type: list
  * Description: A list of strings containing tags, example: ["tag1", "tag2"]
  * Required: no
* Key: notes
  * Type: string
  * Description: A top-level note of the document
  * Required: no


**Response:**

*   Status code: `201` or `200` if document already exist
*   Created document details:

```

{
    "id": "0000ffff2222eeee3333dddd4444",
    "url": "https://read.readwise.io/new/read/0000ffff2222eeee3333dddd4444",
}
              
```


**Usage/Examples:**

*   JavaScript

```

$.ajax({
  url: 'https://readwise.io/api/v3/save/',
  type: 'POST',
  contentType: 'application/json',
  beforeSend: function (xhr) {
    xhr.setRequestHeader('Authorization', 'Token XXX');
    },
  data: JSON.stringify({
    "url": "https://example.com/article/",
    "html": "<div><h1>This article is awesome</h1><p>content here!</p></div>"
    "tags": ["tag1", "tag2"]
  }),
  success: function (result) {console.log(result)},
  error: function (error) {console.log(error)},
});
          
```


*   Python

```

import requests
requests.post(
    url="https://readwise.io/api/v3/save/",
    headers={"Authorization": "Token XXX"},
    json={
        "url": "https://example.com/article/",
        # No html is provided, so the url will be scraped to get the document's content.
        "tags": ["tag3", "tag4"]
    }
)
                    
```


*   Bash

```

$ curl -v https://readwise.io/api/v3/save/ -H "Authorization: Token XXX" -X POST -d '{"url": "https://example.com/article/"}' -H "Content-Type: application/json"
                    
```


Document LIST
-------------

**Request**: `GET` to `https://readwise.io/api/v3/list/`

**Parameters:** Usual query params:



* Key: id
  * Type: string
  * Description: The document's unique id. Using this parameter it will return just one document, if found.
  * Required: no
* Key: updatedAfter
  * Type: string (formatted as ISO 8601 date)
  * Description: Fetch only documents updated after this date
  * Required: no
* Key: location
  * Type: string
  * Description: The document's location, could be one of: new, later, shortlist, archive, feed
  * Required: no
* Key: category
  * Type: string
  * Description: The document's category, could be one of: article, email, rss, highlight, note, pdf, epub, tweet, video
  * Required: no
* Key: tag
  * Type: string
  * Description: The document's tag key. Pass up to 5 tag parameters to find documents having all the tags listed. Pass empty value (?tag=) to find untagged documents. Use the Tag LIST endpoint to retrieve all tags available.
  * Required: no
* Key: pageCursor
  * Type: string
  * Description: A string returned by a previous request to this endpoint. Use it to get the next page of documents if there are too many for one request.
  * Required: no
* Key: withHtmlContent
  * Type: boolean
  * Description: Include the html_content field in each document's data. Please note that enabling this feature may slightly increase request processing time. Could be one of: true, false.
  * Required: no
* Key: withRawSourceUrl
  * Type: boolean
  * Description:                                             Include the raw_source_url field in each document's data, containing a direct Amazon S3 link to the raw document source file.                                            The link is empty for non-distributable documents, like Wisereads previews.                                            The link is valid for one hour.                                            Please note that enabling this feature may slightly increase request processing time.                                            Could be one of: true, false.                                        
  * Required: no


**Response:**

*   Status code: `200`
*   Please keep in mind that both highlights and notes made in Reader are also considered Documents. Highlights and notes will have \`parent\_id\` set, which is the Document id of the article/book/etc and highlight that they belong to, respectively.
*   All dates are UTC unless otherwise stated.
*   List of documents:

```

{
    "count": 2304,
    "nextPageCursor": "01gm6kjzabcd609yepjrmcgz8a",
    "results": [
        {
            "id": "01gwfvp9pyaabcdgmx14f6ha0",
            "url": "https://readiwise.io/feed/read/01gwfvp9pyaabcdgmx14f6ha0",
            "source_url": "https://www.driverlesscrocodile.com/values/ends-and-meanings-3-alasdair-macintyre-virtue-mortality-and-story-in-heroic-societies/",
            "title": "Ends and Meanings (3): Alasdair MacIntyre virtue, mortality and story in heroic societies",
            "author": "Stuart Patience",
            "source": "Reader RSS",
            "category": "rss",
            "location": "feed",
            "tags": {},
            "site_name": "Driverless Crocodile",
            "word_count": 819,
            "reading_time": "4 mins",
            "created_at": "2023-03-26T21:02:51.618751+00:00",
            "updated_at": "2023-03-26T21:02:55.453827+00:00",
            "notes": "",
            "published_date": "2023-03-22",
            "summary": "Without … a place in the social order, ...",
            "image_url": "https://i0.wp.com/www.driverlesscrocodile.com/wp-content/uploads/2019/10/cropped-driverlesscrocodile-icon-e1571123201159-4.jpg?fit=32%2C32&ssl=1",
            "parent_id": null,
            "reading_progress": 0.15,
            "first_opened_at": null,
            "last_opened_at": null,
            "saved_at": "2023-03-26T21:02:51.618751+00:00",
            "last_moved_at": "2023-03-27T21:03:52.118752+00:00",
        },
        {
            "id": "01gkqtdz9xabcd5gt96khreyb",
            "url": "https://readiwise.io/new/read/01gkqtdz9xabcd5gt96khreyb",
            "source_url": "https://www.vanityfair.com/hollywood/2017/08/the-story-of-the-ducktales-theme-music",
            "title": "The Story of the DuckTales Theme, History’s Catchiest Single Minute of Music",
            "author": "Darryn King",
            "source": "Reader add from import URL",
            "category": "article",
            "location": "new",
            "tags": {},
            "site_name": "Vanity Fair",
            "word_count": 2678,
            "reading_time": "11 mins",
            "created_at": "2022-12-08T02:53:29.639650+00:00",
            "updated_at": "2022-12-13T20:37:42.544298+00:00",
            "published_date": "2017-08-09",
            "notes": "A sample note",
            "summary": "A woo-hoo heard around the world.",
            "image_url": "https://media.vanityfair.com/photos/598b1452f7f0a433bd4d149c/16:9/w_1280,c_limit/t-ducktales-woohoo-song.png",
            "parent_id": null,
            "reading_progress": 0.5,
            "first_opened_at": "2023-03-26T21:02:51.618751+00:00",
            "last_opened_at": "2023-03-29T21:02:51.618751+00:00",
            "saved_at": "2023-03-26T21:02:51.618751+00:00",
            "last_moved_at": "2023-03-27T21:03:52.118752+00:00",
        },
        {
            "id": "01gkqt8nbms4t698abcdvcswvf",
            "url": "https://readwise.io/new/read/01gkqt8nbms4t698abcdvcswvf",
            "source_url": "https://www.vanityfair.com/news/2022/10/covid-origins-investigation-wuhan-lab",
            "title": "COVID-19 Origins: Investigating a “Complex and Grave Situation” Inside a Wuhan Lab",
            "author": "Condé Nast",
            "source": "Reader add from import URL",
            "category": "article",
            "location": "new",
            "tags": {},
            "site_name": "Vanity Fair",
            "word_count": 9601,
            "reading_time": "37 mins",
            "created_at": "2022-12-08T02:50:35.662027+00:00",
            "updated_at": "2023-03-22T13:29:41.827456+00:00",
            "published_date": "2022-10-28",
            "notes": "",
            "summary": "The Wuhan Institute of Virology, the cutting-edge ...",
            "image_url": "https://media.vanityfair.com/photos/63599642578d980751943b65/16:9/w_1280,c_limit/vf-1022-covid-trackers-site-story.jpg",
            "parent_id": null,
            "reading_progress": 0,
            "first_opened_at": "2023-03-26T21:02:51.618751+00:00",
            "last_opened_at": "2023-03-26T21:02:51.618751+00:00",
            "saved_at": "2023-03-26T21:02:51.618751+00:00",
            "last_moved_at": "2023-03-27T21:03:52.118752+00:00",
        }
    ]
}
              
```


**Usage/Examples:**

*   JavaScript

```

const token = "XXX"; // use your access token here

const fetchDocumentListApi = async (updatedAfter=null, location=null) => {
    let fullData = [];
    let nextPageCursor = null;

    while (true) {
      const queryParams = new URLSearchParams();
      if (nextPageCursor) {
        queryParams.append('pageCursor', nextPageCursor);
      }
      if (updatedAfter) {
        queryParams.append('updatedAfter', updatedAfter);
      }
      if (location) {
        queryParams.append('location', location);
      }
      console.log('Making export api request with params ' + queryParams.toString());
      const response = await fetch('https://readwise.io/api/v3/list/?' + queryParams.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      const responseJson = await response.json();
      fullData.push(...responseJson['results']);
      nextPageCursor = responseJson['nextPageCursor'];
      if (!nextPageCursor) {
        break;
      }
    }
    return fullData;
};

// Get all of a user's documents from all time
const allData = await fetchDocumentListApi();

// Get all of a user's archived documents
const archivedData = await fetchDocumentListApi(null, 'archive');

// Later, if you want to get new documents updated after some date, do this:
const docsAfterDate = new Date(Date.now() - 24 * 60 * 60 * 1000);  // use your own stored date
const newData = await fetchDocumentListApi(docsAfterDate.toISOString());
          
```


*   Python

```

import datetime
import requests  # This may need to be installed from pip

token = 'XXX'

def fetch_reader_document_list_api(updated_after=None, location=None):
    full_data = []
    next_page_cursor = None
    while True:
        params = {}
        if next_page_cursor:
            params['pageCursor'] = next_page_cursor
        if updated_after:
            params['updatedAfter'] = updated_after
        if location:
            params['location'] = location
        print("Making export api request with params " + str(params) + "...")
        response = requests.get(
            url="https://readwise.io/api/v3/list/",
            params=params,
            headers={"Authorization": f"Token {token}"}, verify=False
        )
        full_data.extend(response.json()
['results'])
        next_page_cursor = response.json().get('nextPageCursor')
        if not next_page_cursor:
            break
    return full_data

# Get all of a user's documents from all time
all_data = fetch_reader_document_list_api()

# Get all of a user's archived documents
archived_data = fetch_reader_document_list_api(location='archive')

# Later, if you want to get new documents updated after some date, do this:
docs_after_date = datetime.datetime.now() - datetime.timedelta(days=1)  # use your own stored date
new_data = fetch_reader_document_list_api(docs_after_date.isoformat())
                    
```


*   Bash

```

$ curl -v https://readwise.io/api/v3/list/?location=later -H "Authorization: Token XXX" -H "Content-Type: application/json"
                    
```


Document UPDATE
---------------

Use this API to update specific fields from the list below.  
Fields omitted from the request will remain unchanged.

**Request**: `PATCH` to `https://readwise.io/api/v3/update/<document_id>/`

**Parameters:** A JSON object with the following keys:



* Key: title
  * Type: string
  * Description: The document's title, it will overwrite the original title of the document                                        
  * Required: no
* Key: author
  * Type: string
  * Description: The document's author, it will overwrite the original author (if found                                            during the parsing step)                                        
  * Required: no
* Key: summary
  * Type: string
  * Description: Summary of the document
  * Required: no
* Key: published_date
  * Type: date
  * Description: A datetime representing when the document was published in the ISO 8601                                            format;                                            default timezone is UTC.Example:                                            "2020-07-14T20:11:24+00:00"
  * Required: no
* Key: image_url
  * Type: string
  * Description: An image URL to use as cover image
  * Required: no
* Key: seen
  * Type: boolean
  * Description: Mark the document as seen/unseen (without deleting it). Setting true will populate first_opened_at / last_opened_at; setting false will clear them.
  * Required: no
* Key: location
  * Type: string
  * Description: One of: new, later, archive or feed.                                            Represents the current location of the document (previously called triage_status).                                            Note: if you try to use a location the user doesn't have enabled in their settings, this value will be set to their default location.                                        
  * Required: no
* Key: category
  * Type: string
  * Description: One of: article, email, rss, highlight, note, pdf,epub, tweet or video.                                        
  * Required: no
* Key: tags
  * Type: list
  * Description: A list of strings containing tags, example: ["tag1", "tag2"]
  * Required: no


**Response:**

*   Status code: `200`
*   Updated document details:

```

{
    "id": "0000ffff2222eeee3333dddd4444",
    "url": "https://read.readwise.io/new/read/0000ffff2222eeee3333dddd4444",
}
              
```


**Usage/Examples:**

*   JavaScript

```

$.ajax({
  url: 'https://readwise.io/api/v3/update/0000ffff2222eeee3333dddd4444',
  type: 'PATCH',
  contentType: 'application/json',
  beforeSend: function (xhr) {
    xhr.setRequestHeader('Authorization', 'Token XXX');
    },
  data: JSON.stringify({
    "title": "Updated title",
    "location": "new"
  }),
  success: function (result) {console.log(result)},
  error: function (error) {console.log(error)},
});
          
```


*   Python

```

import requests
requests.patch(
    url="https://readwise.io/api/v3/update/0000ffff2222eeee3333dddd4444",
    headers={"Authorization": "Token XXX"},
    json={
        "title": "Updated title",
        "location": "new",
    }
)
                    
```


*   Bash

```

$ curl -v https://readwise.io/api/v3/update/0000ffff2222eeee3333dddd4444 -H "Authorization: Token XXX" -X PATCH -d '{"title": "Updated title"}' -H "Content-Type: application/json"
                    
```


Document DELETE
---------------

**Request**: `DELETE` to `https://readwise.io/api/v3/delete/<document_id>/`

**Response:**

*   Status code: `204`

**Usage/Examples:**

*   JavaScript

```

$.ajax({
  url: 'https://readwise.io/api/v3/delete/0000ffff2222eeee3333dddd4444',
  type: 'DELETE',
  beforeSend: function (xhr) {
    xhr.setRequestHeader('Authorization', 'Token XXX');
    },
  success: function (result) {console.log(result)},
  error: function (error) {console.log(error)},
});
          
```


*   Python

```

import requests
requests.delete(
    url="https://readwise.io/api/v3/delete/0000ffff2222eeee3333dddd4444",
    headers={"Authorization": "Token XXX"},
)
                    
```


*   Bash

```

$ curl -v https://readwise.io/api/v3/delete/0000ffff2222eeee3333dddd4444 -H "Authorization: Token XXX" -X DELETE
                    
```


Rate Limiting
-------------

The default base rate is 20 requests per minute (per access token) but the `Document CREATE` and `Document UPDATE` endpoints have higher limits of 50 requests per minute (per access token). You can check `Retry-After` header in the 429 response to get the number of seconds to wait for.

Webhooks
--------

Receive real-time notifications about your highlights and documents via webhooks. Configure webhooks to automatically receive updates when highlights are created, updated, or deleted.

For detailed documentation on setting up and using webhooks, including available event types, payload formats, and best practices, please visit:

[Webhooks Documentation →](https://docs.readwise.io/readwise/docs/webhooks)

You can also configure your webhooks directly in your account settings: [Configure Webhooks](https://readwise.io/webhook)