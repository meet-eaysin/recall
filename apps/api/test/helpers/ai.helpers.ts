import { expect } from '@jest/globals';

export interface IngestionStatus {
  ingestionStatus?: string;
  currentStage?: string;
  embeddingsReady: boolean;
  ingestionError?: string;
}

export interface IngestionStatusResponse {
  success: boolean;
  data: IngestionStatus;
}

export function isIngestionStatusResponse(body: unknown): body is IngestionStatusResponse {
  if (typeof body !== 'object' || body === null) return false;
  if (!('success' in body) || body.success !== true) return false;
  if (!('data' in body) || typeof body.data !== 'object' || body.data === null) return false;

  const { data } = body;
  return 'embeddingsReady' in data && typeof data.embeddingsReady === 'boolean';
}

export function assertContainsFact(answer: string, fact: string): void {
  const normalizedAnswer = answer.toLowerCase();
  const normalizedFact = fact.toLowerCase();

  const factWords = normalizedFact.split(/\s+/).filter(w => w.length > 3);
  const matchCount = factWords.filter(word => normalizedAnswer.includes(word)).length;

  if (factWords.length === 0) return;

  expect(matchCount / factWords.length).toBeGreaterThan(0.5);
}

export function assertIngestionCompleted(body: unknown): void {
  if (isIngestionStatusResponse(body)) {
    expect(body.success).toBe(true);
    expect(body.data.embeddingsReady).toBe(true);
  } else {
    throw new Error('Response body does not match IngestionStatusResponse shape');
  }
}
