'use client';

import * as React from 'react';
import {
  type DocumentDetail,
  type IngestionStatusView,
  type NoteRow,
} from '../../types';
import {
  useDocument,
  useDocumentIngestion,
  useDocumentTranscript,
  useNotes,
  useUpdateDocument,
  useGenerateSummary,
  useDeleteSummary,
  useGenerateTranscript,
  useRetryIngestion,
  useCreateNote,
  useDeleteDocument,
  useDeleteNote,
  useUpdateNote,
} from '../../hooks';

interface DocumentDetailContextType {
  id: string;
  document: DocumentDetail | undefined;
  ingestion: IngestionStatusView | undefined;
  transcript:
    | {
        content: string;
        status: string;
        reason?: string;
      }
    | undefined;
  notes: NoteRow[];
  isLoading: boolean;
  error: Error | null;
  actions: {
    updateDocument: ReturnType<typeof useUpdateDocument>;
    generateSummary: ReturnType<typeof useGenerateSummary>;
    deleteSummary: ReturnType<typeof useDeleteSummary>;
    generateTranscript: ReturnType<typeof useGenerateTranscript>;
    retryIngestion: ReturnType<typeof useRetryIngestion>;
    createNote: ReturnType<typeof useCreateNote>;
    deleteDocument: ReturnType<typeof useDeleteDocument>;
    deleteNote: ReturnType<typeof useDeleteNote>;
    updateNote: ReturnType<typeof useUpdateNote>;
  };
}

const DocumentDetailContext =
  React.createContext<DocumentDetailContextType | null>(null);

export function DocumentDetailProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { data: document, error, isLoading } = useDocument(id);
  const { data: ingestion } = useDocumentIngestion(id);
  const isYoutubeDocument = document?.type === 'youtube';
  const { data: transcript } = useDocumentTranscript(id, isYoutubeDocument);
  const { data: notes = [] } = useNotes(id);

  const updateDocument = useUpdateDocument(id);
  const generateSummary = useGenerateSummary(id);
  const deleteSummary = useDeleteSummary(id);
  const generateTranscript = useGenerateTranscript(id);
  const retryIngestion = useRetryIngestion(id);
  const createNote = useCreateNote(id);
  const deleteDocument = useDeleteDocument();
  const deleteNote = useDeleteNote(id);
  const updateNote = useUpdateNote(id);

  const value = React.useMemo(
    () => ({
      id,
      document,
      ingestion,
      transcript,
      notes,
      isLoading,
      error,
      actions: {
        updateDocument,
        generateSummary,
        deleteSummary,
        generateTranscript,
        retryIngestion,
        createNote,
        deleteDocument,
        deleteNote,
        updateNote,
      },
    }),
    [
      id,
      document,
      ingestion,
      transcript,
      notes,
      isLoading,
      error,
      updateDocument,
      generateSummary,
      deleteSummary,
      generateTranscript,
      retryIngestion,
      createNote,
      deleteDocument,
      deleteNote,
      updateNote,
    ],
  );

  return (
    <DocumentDetailContext.Provider value={value}>
      {children}
    </DocumentDetailContext.Provider>
  );
}

export function useDocumentDetail() {
  const context = React.useContext(DocumentDetailContext);
  if (!context) {
    throw new Error(
      'useDocumentDetail must be used within a DocumentDetailProvider',
    );
  }
  return context;
}
