'use client';

import { useEffect } from 'react';

interface ViewCountTrackerProps {
  postId: string;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

export function ViewCountTracker({ postId }: ViewCountTrackerProps) {
  useEffect(() => {
    const key = `viewed_${postId}`;
    const last = localStorage.getItem(key);

    if (last && Date.now() - Number(last) < ONE_DAY) return;

    localStorage.setItem(key, String(Date.now()));
    fetch(`/api/board/posts/${postId}/view`, { method: 'POST' });
  }, [postId]);

  return null;
}
