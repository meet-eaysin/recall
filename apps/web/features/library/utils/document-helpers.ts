import {
  Globe,
  Youtube,
  FileText,
  ImageIcon,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { DocumentType, DocumentStatus } from '@repo/types';

const DOCUMENT_ICON_MAP: Record<DocumentType, LucideIcon> = {
  [DocumentType.URL]: Globe,
  [DocumentType.YOUTUBE]: Youtube,
  [DocumentType.PDF]: FileText,
  [DocumentType.IMAGE]: ImageIcon,
  [DocumentType.TEXT]: BookOpen,
};

export function getDocumentIcon(type: DocumentType): LucideIcon {
  return DOCUMENT_ICON_MAP[type] ?? FileText;
}

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

const STATUS_BADGE_MAP: Record<DocumentStatus, BadgeVariant> = {
  [DocumentStatus.TO_READ]: 'info',
  [DocumentStatus.TO_WATCH]: 'info',
  [DocumentStatus.IN_PROCESS]: 'warning',
  [DocumentStatus.REVIEW]: 'secondary',
  [DocumentStatus.UPCOMING]: 'outline',
  [DocumentStatus.COMPLETED]: 'success',
  [DocumentStatus.PENDING_COMPLETION]: 'warning',
  [DocumentStatus.ARCHIVED]: 'secondary',
};

export function getStatusBadgeVariant(status: DocumentStatus): BadgeVariant {
  return STATUS_BADGE_MAP[status] ?? 'outline';
}

const STATUS_LABEL_MAP: Record<DocumentStatus, string> = {
  [DocumentStatus.TO_READ]: 'To Read',
  [DocumentStatus.TO_WATCH]: 'To Watch',
  [DocumentStatus.IN_PROCESS]: 'In Progress',
  [DocumentStatus.REVIEW]: 'Review',
  [DocumentStatus.UPCOMING]: 'Upcoming',
  [DocumentStatus.COMPLETED]: 'Completed',
  [DocumentStatus.PENDING_COMPLETION]: 'Pending',
  [DocumentStatus.ARCHIVED]: 'Archived',
};

export function getStatusLabel(status: DocumentStatus): string {
  return STATUS_LABEL_MAP[status] ?? status;
}

const TYPE_LABEL_MAP: Record<DocumentType, string> = {
  [DocumentType.URL]: 'Article',
  [DocumentType.YOUTUBE]: 'Video',
  [DocumentType.PDF]: 'PDF',
  [DocumentType.IMAGE]: 'Image',
  [DocumentType.TEXT]: 'Note',
};

export function getTypeLabel(type: DocumentType): string {
  return TYPE_LABEL_MAP[type] ?? type;
}
