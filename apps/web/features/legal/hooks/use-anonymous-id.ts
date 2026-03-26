'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'recall_anonymous_id';

export function useAnonymousId() {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    let existingId = localStorage.getItem(STORAGE_KEY);
    if (!existingId) {
      existingId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, existingId);
    }
    setId(existingId);
  }, []);

  return id;
}
