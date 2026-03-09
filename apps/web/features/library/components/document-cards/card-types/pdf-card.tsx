import type { DocumentRow } from '@/lib/api/documents';
import { BaseDocumentCard } from '../base-document-card';

interface PdfCardProps {
  document: DocumentRow;
}

export function PdfCard({ document }: PdfCardProps) {
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
