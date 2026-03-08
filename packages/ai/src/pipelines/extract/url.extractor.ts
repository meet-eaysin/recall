import axios from 'axios';
import https from 'https';

export interface UrlExtractResult {
  title: string;
  author: string | undefined;
  publishedAt: string | undefined;
  markdown: string;
  language: string | undefined;
  isPartial: boolean;
}

export class UrlExtractor {
  async extractFromUrl(url: string, retryCount = 1): Promise<UrlExtractResult> {
    try {
      const { extract } = await import('@extractus/article-extractor');
      const article = await extract(url);

      if (article && article.content) {
        const markdown = article.content;

        let language = 'en';
        if ('language' in article && typeof article.language === 'string') {
          language = article.language;
        }

        return {
          title: article.title || 'Untitled',
          author: article.author || undefined,
          publishedAt: article.published || undefined,
          markdown: markdown,
          language,
          isPartial: markdown.length < 200,
        };
      }

      throw new Error('Could not extract content from URL');
    } catch {
      if (retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.extractFromUrl(url, retryCount - 1);
      }

      // Fallback: Fetch raw HTML and extract body
      const response = await axios.get(url, {
        timeout: 15000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });
      const html = response.data;

      return {
        title: 'Untitled',
        markdown: html.substring(0, 1000),
        author: undefined,
        publishedAt: undefined,
        language: 'en',
        isPartial: true,
      };
    }
  }
}
export const urlExtractor = new UrlExtractor();
