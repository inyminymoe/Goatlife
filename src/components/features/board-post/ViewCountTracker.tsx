'use client';

import { useEffect } from 'react';

interface ViewCountTrackerProps {
  postId: string;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

function getLastViewed(key: string): number | null {
  try {
    const val = localStorage.getItem(key);
    return val ? Number(val) : null;
  } catch {
    return null;
  }
}

function setLastViewed(key: string): void {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // 프라이빗 모드 또는 용량 초과 시 무시
  }
}

export function ViewCountTracker({ postId }: ViewCountTrackerProps) {
  useEffect(() => {
    const key = `viewed_${postId}`;
    const last = getLastViewed(key);

    if (last !== null && Date.now() - last < ONE_DAY) return;

    fetch(`/api/board/posts/${postId}/view`, { method: 'POST' }).then(res => {
      if (res.ok) setLastViewed(key);
    });
  }, [postId]);

  return null;
}
