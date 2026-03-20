'use client';
import {
  useState,
  useRef,
  useEffect,
  useContext,
  createContext,
  useId,
  ReactNode,
  HTMLAttributes,
  ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
} from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────

interface DropdownMenuCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerId: string;
  contentId: string;
}

const Ctx = createContext<DropdownMenuCtx | null>(null);

function useCtx() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('DropdownMenu compound 컴포넌트 안에서만 사용하세요.');
  return ctx;
}

// ─── DropdownMenu (Root) ──────────────────────────────────────────────────────

interface DropdownMenuProps {
  children: ReactNode;
  /** 외부에서 open 상태를 직접 제어하고 싶을 때 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({
  children,
  open: controlledOpen,
  onOpenChange,
}: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const id = useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <Ctx.Provider
      value={{
        open,
        setOpen,
        triggerId: `${id}-trigger`,
        contentId: `${id}-content`,
      }}
    >
      <div className="ui-component relative inline-block">{children}</div>
    </Ctx.Provider>
  );
}

// ─── DropdownMenuTrigger ──────────────────────────────────────────────────────

interface DropdownMenuTriggerProps {
  children: ReactNode;
  /** true면 자식 엘리먼트 자체에 트리거 동작을 위임 (shadcn asChild) */
  asChild?: boolean;
}

export function DropdownMenuTrigger({
  children,
  asChild = false,
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerId, contentId } = useCtx();

  const triggerProps = {
    id: triggerId,
    'aria-haspopup': 'true' as const,
    'aria-expanded': open,
    'aria-controls': contentId,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(!open);
    },
  };

  if (asChild && isValidElement(children)) {
    return cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      triggerProps
    );
  }

  return (
    <button type="button" {...triggerProps}>
      {children}
    </button>
  );
}

// ─── DropdownMenuContent ──────────────────────────────────────────────────────

type Placement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

const placementClass: Record<Placement, string> = {
  'bottom-start': 'top-full left-0 mt-1',
  'bottom-end': 'top-full right-0 mt-1',
  'top-start': 'bottom-full left-0 mb-1',
  'top-end': 'bottom-full right-0 mb-1',
};

interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  placement?: Placement;
}

export function DropdownMenuContent({
  children,
  placement = 'bottom-start',
  className = '',
  ...rest
}: DropdownMenuContentProps) {
  const { open, setOpen, contentId, triggerId } = useCtx();
  const contentRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const trigger = document.getElementById(triggerId);
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        !trigger?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen, triggerId]);

  // Esc 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      id={contentId}
      role="dialog"
      className={`
        absolute z-50
        rounded-[5px] border border-dark shadow-lg
        bg-dark
        ${placementClass[placement]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}

// ─── DropdownMenuItem ─────────────────────────────────────────────────────────
// 선택지가 필요할 때 쓰는 옵션 아이템 (optional)

interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** true면 클릭 시 메뉴를 닫지 않습니다 */
  keepOpen?: boolean;
}

export function DropdownMenuItem({
  children,
  keepOpen = false,
  onClick,
  className = '',
  ...rest
}: DropdownMenuItemProps) {
  const { setOpen } = useCtx();

  return (
    <button
      type="button"
      className={`
        w-full px-3 py-2 text-left body-sm font-body
        flex items-center gap-2
        transition-colors duration-100
        hover:bg-[hsl(210,18%,96%)]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ color: 'hsl(0, 0%, 21%)' }}
      onClick={e => {
        onClick?.(e);
        if (!keepOpen) setOpen(false);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── DropdownMenuSeparator ────────────────────────────────────────────────────

export function DropdownMenuSeparator({
  className = '',
}: {
  className?: string;
}) {
  return (
    <hr
      className={`my-1 ${className}`}
      style={{ borderColor: 'hsl(0, 0%, 90%)' }}
    />
  );
}
