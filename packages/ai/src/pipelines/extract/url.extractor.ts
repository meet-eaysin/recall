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
turndownService.remove([
  'script',
  'style',
  'noscript',
  'iframe',
  'button',
  'nav',
  'footer',
]);

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
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          validateStatus: (status) => status < 500, // Handle 4xx as possible content
        });

        if (response.status === 403 || response.status === 401) {
          return {
            title: 'Access Restricted',
            markdown: `This website is restricted or requires authentication. Status Code: ${response.status}. Please consider uploading a PDF or Text version of this content.`,
            author: undefined,
            publishedAt: undefined,
            language: 'en',
            isPartial: true,
          };
        }

        const html = response.data;
        if (typeof html !== 'string') {
          throw new Error('Invalid HTML response');
        }

        // Improved body extraction: look for main content areas
        const contentMatch =
          html.match(/<main[^>]*>([\s\S]*)<\/main>/i) ||
          html.match(/<article[^>]*>([\s\S]*)<\/article>/i) ||
          html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        const htmlToConvert = contentMatch ? contentMatch[1] : html;
        const markdown = turndownService.turndown(htmlToConvert || '');

        return {
          title: 'Direct Scan',
          markdown: markdown.substring(0, 20000), // Larger limit for conversion
          author: undefined,
          publishedAt: undefined,
          language: 'en',
          isPartial: true,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return {
          title: 'Ingestion Error',
          markdown: `Failed to extract content from this URL: ${errorMsg}. This may be due to bot protection, complex JS rendering, or network restrictions.`,
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
