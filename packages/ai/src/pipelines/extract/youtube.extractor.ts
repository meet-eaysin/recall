import { YoutubeTranscript } from 'youtube-transcript';
import axios from 'axios';
import { z } from 'zod';

const OEmbedSchema = z.object({
  title: z.string(),
  author_name: z.string(),
  thumbnail_url: z.string(),
});

interface YTTranscriptResponse {
  text: string;
  duration: number;
  offset: number;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface YouTubeExtractResult {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  thumbnail?: string;
  transcript: TranscriptSegment[];
}

interface VideoMetadata {
  title: string;
  channelTitle: string;
  description: string;
  thumbnail: string;
}

export class YouTubeExtractor {
  async extractYouTube(url: string): Promise<YouTubeExtractResult> {
    const videoId = this.extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');

    const metadata = await this.fetchMetadata(videoId);
    let transcript: YTTranscriptResponse[] = [];

    // Try multiple languages and methods to fetch transcript
    const langs = ['en', 'bn', 'hi']; // Common languages for this user base

    for (const lang of langs) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        if (transcript.length > 0) break;
      } catch (err) {
        // Continue to next language
      }
    }

    // Last ditch effort: try without lang parameter
    if (transcript.length === 0) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (err) {
        console.warn(`All transcript fetch attempts failed for ${videoId}`);
      }
    }

    return {
      videoId,
      title: metadata.title,
      description: metadata.description,
      thumbnail: metadata.thumbnail,
      channelTitle: metadata.channelTitle,
      transcript: transcript.map((t) => ({
        text: t.text,
        start: t.offset,
        duration: t.duration,
      })),
    };
  }

  private async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    try {
      const response = await axios.get(oembedUrl);
      const data = OEmbedSchema.parse(response.data);
      return {
        title: data.title,
        channelTitle: data.author_name,
        description: '',
        thumbnail: data.thumbnail_url,
      };
    } catch {
      return {
        title: 'Unknown Title',
        channelTitle: 'Unknown Channel',
        description: '',
        thumbnail: '',
      };
    }
  }

  private extractVideoId(url: string): string | null {
    const regex =
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;
    const match = url.match(regex);
    return match ? (match[1] ?? null) : null;
  }
}

export const youtubeExtractor = new YouTubeExtractor();
