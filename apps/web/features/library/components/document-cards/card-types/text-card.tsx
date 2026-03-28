import type { DocumentDetail, DocumentRow } from '@/features/library/types';
import { CardTitle } from '@/components/ui/card';
import { BaseDocumentCard } from '../base-document-card';

interface TextCardProps {
  document: DocumentRow;
}

export function TextCard({ document }: TextCardProps) {
  const detail = document as DocumentDetail;

  return (
    <BaseDocumentCard document={document}>
      <div className="space-y-1.5 min-w-0">
        <CardTitle className="line-clamp-2 text-[14px] leading-5.5 tracking-tight font-semibold">
          {document.title}
        </CardTitle>
        {detail.content && (
          <p className="line-clamp-3 text-[11px] leading-relaxed text-muted-foreground/80 whitespace-pre-wrap font-sans-subtle">
            {detail.content.trim()}
          </p>
        )}
      </div>
    </BaseDocumentCard>
  );
}
