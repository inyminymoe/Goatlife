import { useEffect, useRef } from 'react';

/**
 * Modal/BottomSheet 내부에서 포커스를 가두는 훅
 * Tab 키로 순환하며, 외부로 포커스가 나가지 않도록 한다
 * @param isActive - 포커스 트랩 활성화 여부
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  isActive: boolean
) {
  const containerRef = useRef<T>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // 이전 포커스 저장
    previousActiveElement.current = document.activeElement as HTMLElement;

    // 포커스 가능한 요소들
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    // 컨테이너 내부로 포커스 이동
    const firstFocusable =
      container.querySelector<HTMLElement>(focusableSelector);
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector)
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab: 역방향 순환
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab: 정방향 순환
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // 이전 포커스 복원
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
}
