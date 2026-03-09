import type { DocumentRow } from '@/features/library/types';
import { CardTitle } from '@/components/ui/card';
import { BaseDocumentCard } from '../base-document-card';

interface TextCardProps {
  document: DocumentRow;
}

export function TextCard({ document }: TextCardProps) {
  return (
    <BaseDocumentCard document={document}>
      <CardTitle className="line-clamp-3 text-[14px] leading-5.5 tracking-tight">
        {document.title}
      </CardTitle>
    </BaseDocumentCard>
  );
}
