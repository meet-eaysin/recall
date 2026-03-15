import axios from 'axios';
import https from 'https';
import TurndownService from 'turndown';

export interface UrlExtractResult {
  title: string;
  author: string | undefined;
  publishedAt: string | undefined;
  markdown: string;
  language: string | undefined;
  isPartial: boolean;
}

const turndownService = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// Remove unnecessary tags that might persist in HTML
turndownService.remove(['script', 'style', 'noscript', 'iframe', 'button', 'nav', 'footer']);

export class UrlExtractor {
  async extractFromUrl(url: string, retryCount = 1): Promise<UrlExtractResult> {
    try {
      const { extract } = await import('@extractus/article-extractor');
      const article = await extract(url);

      if (article && article.content) {
        // article.content is HTML, convert to clean Markdown
        const markdown = turndownService.turndown(article.content);

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

      // Fallback: Fetch raw HTML and extract body or at least clear some tags
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        });

        const html = response.data;
        // Simple body extraction to avoid converting the whole page (head, etc)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const htmlToConvert = bodyMatch ? bodyMatch[1] : html;
        const markdown = turndownService.turndown(htmlToConvert);

        return {
          title: 'Untitled',
          markdown: markdown.substring(0, 15000), // Larger limit for conversion
          author: undefined,
          publishedAt: undefined,
          language: 'en',
          isPartial: true,
        };
      } catch (err) {
        return {
          title: 'Error',
          markdown: 'Failed to extract content after multiple attempts.',
          author: undefined,
          publishedAt: undefined,
          language: 'en',
          isPartial: false,
        };
      }
    }
  }
}
export const urlExtractor = new UrlExtractor();
