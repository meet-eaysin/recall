import type { DocumentRow } from '@/features/library/types';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { BaseDocumentCard } from '../base-document-card';

interface ImageCardProps {
  document: DocumentRow;
}

export function ImageCard({ document }: ImageCardProps) {
  const sourceLabel = getSourceLabel(document.sourceUrl);

  return (
    <BaseDocumentCard document={document}>
      <CardTitle className="line-clamp-3 text-[14px] leading-5.5 tracking-tight">
        {document.title}
      </CardTitle>
      {sourceLabel && (
        <CardDescription className="truncate text-[13px]">
          {sourceLabel}
        </CardDescription>
      )}
    </BaseDocumentCard>
  );
}

function getSourceLabel(sourceUrl?: string) {
  if (!sourceUrl) return null;

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return sourceUrl;
  }
}
