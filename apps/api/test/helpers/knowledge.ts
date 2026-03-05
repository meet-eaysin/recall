import { TEST_USER_ID } from './common';

export interface FolderResponse {
  success: boolean;
  data: {
    folder: {
      id: string;
      name: string;
      userId: string;
      parentId?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface TagResponse {
  success: boolean;
  data: {
    tag: {
      id: string;
      name: string;
      userId: string;
      color?: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export interface NoteResponse {
  success: boolean;
  data: {
    note: {
      id: string;
      content: string;
      userId: string;
      documentId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}

export function isFolderResponse(body: unknown): body is FolderResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  if (!('folder' in data) || typeof data.folder !== 'object' || data.folder === null) return false;
  const f = data.folder;
  return 'id' in f && typeof f.id === 'string' && 'name' in f && typeof f.name === 'string';
}

export function isTagResponse(body: unknown): body is TagResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  if (!('tag' in data) || typeof data.tag !== 'object' || data.tag === null) return false;
  const t = data.tag;
  return 'id' in t && typeof t.id === 'string' && 'name' in t && typeof t.name === 'string';
}

export function isNoteResponse(body: unknown): body is NoteResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;
  const data = body.data;
  if (!('note' in data) || typeof data.note !== 'object' || data.note === null) return false;
  const n = data.note;
  return 'id' in n && typeof n.id === 'string' && 'content' in n && typeof n.content === 'string';
}

export async function seedFolder(name: string = 'Test Folder', userId: string = TEST_USER_ID): Promise<string> {
  const { FolderModel } = await import('@repo/db');
  const folder = new FolderModel({ name, userId });
  const saved = await folder.save();
  return saved._id.toString();
}

export async function seedTag(name: string = 'Test Tag', userId: string = TEST_USER_ID): Promise<string> {
  const { TagModel } = await import('@repo/db');
  const tag = new TagModel({ name, userId });
  const saved = await tag.save();
  return saved._id.toString();
}

export async function seedNote(content: string, documentId: string, userId: string = TEST_USER_ID): Promise<string> {
  const { NoteModel } = await import('@repo/db');
  const note = new NoteModel({ content, documentId, userId });
  const saved = await note.save();
  return saved._id.toString();
}
