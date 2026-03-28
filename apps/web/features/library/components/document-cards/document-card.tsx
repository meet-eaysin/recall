import { DocumentType } from '@repo/types';
import type { DocumentRow } from '@/features/library/types';
import { UrlCard } from './card-types/url-card';
import { YoutubeCard } from './card-types/youtube-card';
import { PdfCard } from './card-types/pdf-card';
import { TextCard } from './card-types/text-card';
import { ImageCard } from './card-types/image-card';

interface DocumentCardProps {
  document: DocumentRow;
}

const CARD_COMPONENT_MAP: Record<
  DocumentType,
  React.ComponentType<DocumentCardProps>
> = {
  [DocumentType.URL]: UrlCard,
  [DocumentType.YOUTUBE]: YoutubeCard,
  [DocumentType.PDF]: PdfCard,
  [DocumentType.TEXT]: TextCard,
  [DocumentType.IMAGE]: ImageCard,
  [DocumentType.DOCX]: TextCard,
};

export function DocumentCard({ document }: DocumentCardProps) {
  const CardComponent = CARD_COMPONENT_MAP[document.type] ?? UrlCard;
  return <CardComponent document={document} />;
}
