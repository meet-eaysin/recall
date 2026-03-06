import { Client } from '@notionhq/client';
import { DatabaseObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { isObject } from '../../../shared/utils/type-guards.util';

function isDatabaseObject(result: unknown): result is DatabaseObjectResponse {
  if (!isObject(result)) return false;
  return (
    result.object === 'database' &&
    'title' in result &&
    Array.isArray(result.title)
  );
}

@Injectable()
export class NotionClient {
  private async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async listDatabases(token: string) {
    const notion = new Client({ auth: token });
    try {
      const response = await notion.search({});

      const databases: DatabaseObjectResponse[] = [];
      for (const result of response.results) {
        if (isDatabaseObject(result)) {
          databases.push(result);
        }
      }

      return databases.map((db) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
      }));
    } catch {
      throw new InternalServerErrorException('Failed to list Notion databases');
    }
  }

  async createPage(
    token: string,
    databaseId: string,
    doc: {
      title: string;
      content?: string | undefined;
      url?: string | undefined;
    },
  ) {
    const notion = new Client({ auth: token });
    await this.delay(350); // Rate limit
    try {
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [{ text: { content: doc.title } }],
          },
          ...(doc.url ? { URL: { url: doc.url } } : {}),
        },
        children: doc.content
          ? [
              {
                object: 'block',
                type: 'paragraph',
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: doc.content.substring(0, 2000) },
                    },
                  ],
                },
              },
            ]
          : [],
      });

      if (
        isObject(response) &&
        'id' in response &&
        typeof response.id === 'string'
      ) {
        return response.id;
      }
      throw new InternalServerErrorException('Partial response from Notion');
    } catch {
      throw new InternalServerErrorException('Failed to create Notion page');
    }
  }

  async updatePage(
    token: string,
    pageId: string,
    doc: {
      title: string;
      content?: string | undefined;
      url?: string | undefined;
    },
  ) {
    const notion = new Client({ auth: token });
    await this.delay(350); // Rate limit
    try {
      await notion.pages.update({
        page_id: pageId,
        properties: {
          title: {
            title: [{ text: { content: doc.title } }],
          },
          ...(doc.url ? { URL: { url: doc.url } } : {}),
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to update Notion page');
    }
  }

  async deletePage(token: string, pageId: string) {
    const notion = new Client({ auth: token });
    await this.delay(350); // Rate limit
    try {
      await notion.pages.update({
        page_id: pageId,
        archived: true,
      });
    } catch {
      throw new InternalServerErrorException('Failed to delete Notion page');
    }
  }
}
