import type { DocumentRow } from '@/features/library/types';
import { BaseDocumentCard } from '../base-document-card';

interface TextCardProps {
  document: DocumentRow;
}

export function TextCard({ document }: TextCardProps) {
  return (
    <BaseDocumentCard document={document}>
      <h3 className="text-lg font-semibold leading-snug line-clamp-3 group-hover:underline underline-offset-4 decoration-primary/50">
        {document.title}
      </h3>
    </BaseDocumentCard>
  );
}
