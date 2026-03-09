import type { DocumentRow } from '@/features/library/types';
import { BaseDocumentCard } from '../base-document-card';

interface YoutubeCardProps {
  document: DocumentRow;
}

export function YoutubeCard({ document }: YoutubeCardProps) {
  return (
    <BaseDocumentCard document={document}>
      <h3 className="text-base font-semibold leading-snug line-clamp-2 group-hover:underline underline-offset-4 decoration-primary/50">
        {document.title}
      </h3>
      {document.sourceUrl && (
        <p className="mt-1.5 truncate text-xs text-muted-foreground">
          {document.sourceUrl}
        </p>
      )}
    </BaseDocumentCard>
  );
}
