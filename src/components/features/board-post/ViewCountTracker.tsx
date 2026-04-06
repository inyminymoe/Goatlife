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

    // fetch 전에 먼저 세팅 — 동시 마운트로 인한 중복 요청 방지
    setLastViewed(key);
    fetch(`/api/board/posts/${postId}/view`, { method: 'POST' })
      .then(res => {
        if (!res.ok) {
          // HTTP 오류 응답 시 롤백
          localStorage.removeItem(key);
        }
      })
      .catch(() => {
        // 실패 시 다음 방문에서 재시도할 수 있도록 롤백
        localStorage.removeItem(key);
      });
  }, [postId]);

  return null;
}
