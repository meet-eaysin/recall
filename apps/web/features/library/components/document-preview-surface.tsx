'use client';

import * as React from 'react';
import { ExternalLink, FileText, Globe, PlayCircle } from 'lucide-react';
import type { DocumentDetail, DocumentRow } from '../types';
import Image from 'next/image';

type PreviewDocument = Pick<
  DocumentRow,
  'sourceUrl' | 'title' | 'type'
> &
  Partial<Pick<DocumentDetail, 'content'>>;

export function DocumentPreviewSurface({
  compact = false,
  document,
}: {
  compact?: boolean;
  document: PreviewDocument;
}) {
  const sourceUrl = document.sourceUrl;
  const youtubeId = getYouTubeId(sourceUrl);
  const directVideo = isDirectVideoUrl(sourceUrl);
  const directPdf = isPdfUrl(sourceUrl) || document.type === 'pdf';
  const directImage = isImageUrl(sourceUrl) || document.type === 'image';

  if (document.type === 'youtube' && youtubeId) {
    if (compact) {
      return (
        <Image
          alt={document.title}
          className="h-full w-full object-cover"
          loading="lazy"
          src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
        />
      );
    }

    return (
      <iframe
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
        src={`https://www.youtube.com/embed/${youtubeId}`}
        title={document.title}
      />
    );
  }

  if (directVideo && sourceUrl) {
    return compact ? (
      <MediaCard label="Video" title={document.title} subtitle={getHostname(sourceUrl)} />
    ) : (
      <video className="h-full w-full" controls preload="metadata" src={sourceUrl} />
    );
  }

  if (directPdf && sourceUrl) {
    if (compact) {
      return <MediaCard label="PDF" title={document.title} subtitle={getHostname(sourceUrl)} />;
    }

    return (
      <iframe
        className="h-full w-full bg-background"
        src={compact ? `${sourceUrl}#toolbar=0&navpanes=0&scrollbar=0` : sourceUrl}
        title={document.title}
      />
    );
  }

  if (directImage && sourceUrl) {
    return (
      <Image
        alt={document.title}
        className="h-full w-full object-cover"
        loading="lazy"
        src={sourceUrl}
      />
    );
  }

  if (document.type === 'text') {
    return (
      <TextPreview compact={compact} content={document.content} title={document.title} />
    );
  }

  if (sourceUrl) {
    return compact ? (
      <UrlPreviewCard sourceUrl={sourceUrl} title={document.title} />
    ) : (
      <div className="relative h-full w-full">
        <iframe className="h-full w-full bg-background" src={sourceUrl} title={document.title} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-background to-transparent p-4" />
      </div>
    );
  }

  return <FallbackPreview compact={compact} title={document.title} />;
}

function TextPreview({
  compact,
  content,
  title,
}: {
  compact: boolean;
  content?: string;
  title: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="size-4" />
        <span className="text-xs font-medium tracking-wide">Note</span>
      </div>
      <div className="space-y-2">
        <p className={compact ? 'line-clamp-3 text-sm font-medium' : 'text-lg font-medium'}>
          {title}
        </p>
        <p className={compact ? 'line-clamp-4 text-xs text-muted-foreground' : 'line-clamp-8 text-sm text-muted-foreground'}>
          {content?.trim() || 'No content preview is available yet.'}
        </p>
      </div>
    </div>
  );
}

function UrlPreviewCard({
  sourceUrl,
  title,
}: {
  sourceUrl: string;
  title: string;
}) {
  const hostname = getHostname(sourceUrl);

  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Globe className="size-4" />
        <span className="truncate text-xs font-medium tracking-wide">
          {hostname}
        </span>
      </div>
      <div className="space-y-2">
        <p className="line-clamp-3 text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{sourceUrl}</p>
      </div>
    </div>
  );
}

function FallbackPreview({
  compact,
  title,
}: {
  compact: boolean;
  title: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
      <PlayCircle className="size-8 text-muted-foreground" />
      <p className={compact ? 'line-clamp-2 text-sm font-medium' : 'text-lg font-medium'}>
        {title}
      </p>
    </div>
  );
}

function MediaCard({
  label,
  subtitle,
  title,
}: {
  label: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <PlayCircle className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="space-y-2">
        <p className="line-clamp-3 text-sm font-medium">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function DocumentPreviewUnavailable({ sourceUrl }: { sourceUrl?: string }) {
  return (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
      <Globe className="size-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Preview is not available for this source.
      </p>
      {sourceUrl ? (
        <a
          className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          href={sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open source
          <ExternalLink className="size-4" />
        </a>
      ) : null}
    </div>
  );
}

function getYouTubeId(sourceUrl?: string) {
  if (!sourceUrl) return null;

  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.slice(1) || null;
    }

    if (url.hostname.includes('youtube.com')) {
      return url.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

function isPdfUrl(sourceUrl?: string) {
  return Boolean(sourceUrl?.toLowerCase().includes('.pdf'));
}

function isDirectVideoUrl(sourceUrl?: string) {
  if (!sourceUrl) return false;
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(sourceUrl);
}

function isImageUrl(sourceUrl?: string) {
  if (!sourceUrl) return false;
  return /\.(png|jpg|jpeg|gif|webp|avif|svg)(\?|#|$)/i.test(sourceUrl);
}

function getHostname(sourceUrl: string) {
  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}
