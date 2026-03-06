import { useEffect } from 'react';

/**
 * Modal/BottomSheet가 열릴 때 body 스크롤을 잠그는 훅
 * @param isLocked - 스크롤을 잠글지 여부
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // 현재 스크롤 위치 저장
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const scrollY = window.scrollY;

    // body 스크롤 잠금
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // 복원
      document.body.style.overflow = originalStyle;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
