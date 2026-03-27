export interface SmartAddDocumentCommand {
  userId: string;
  source?: string;
  buffer?: Buffer;
  originalName?: string;
  mimeType?: string;
  title?: string;
  description?: string;
  folderIds?: string[];
  tagIds?: string[];
  notes?: string;
}
