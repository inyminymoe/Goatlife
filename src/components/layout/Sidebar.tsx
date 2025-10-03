'use client';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  variant?: 'desktop' | 'mobile';
  isLoggedIn?: boolean;
}

export default function Sidebar({
  isOpen = true,
  onClose,
  variant = 'desktop',
  isLoggedIn = false,
}: SidebarProps) {
  const isMobile = variant === 'mobile';

  // Mobile: 전체화면 오버레이
  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />

            {/* 슬라이딩 사이드바 */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 w-[276px] bg-grey-100 z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-grey-200 rounded-lg transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <Icon
                    icon="material-symbols:close"
                    className="w-6 h-6 text-grey-700"
                  />
                </button>

                <MenuContent isLoggedIn={isLoggedIn} onClose={onClose} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: 고정 사이드바
  return (
    <aside className="h-fit w-[276px] flex-shrink-0 bg-grey-100 rounded-[5px] sticky top-6 ">
      <div className="p-6">
        <MenuContent isLoggedIn={isLoggedIn} />
      </div>
    </aside>
  );
}

function MenuContent({
  isLoggedIn = false,
  onClose,
}: {
  isLoggedIn?: boolean;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 전사게시판 - public */}
      <MenuSection
        icon="icon-park:apple-one"
        title="전사게시판"
        items={[
          '공지사항',
          '성과보고',
          '체력단련실',
          '브레인연료',
          '사내신문고',
        ]}
        isLoggedIn={isLoggedIn}
        requireAuth={false}
        onClose={onClose}
      />

      {/* 부서게시판 - public */}
      <MenuSection
        icon="icon-park:network-tree"
        title="부서게시판"
        items={['IT부', '공시부', '취업부', '자격부', '창작부', '글로벌부']}
        isLoggedIn={isLoggedIn}
        requireAuth={false}
        onClose={onClose}
      />

      {/* 사원정보 - 로그인 필요 */}
      <MenuSection
        icon="icon-park:frog"
        title="사원정보"
        items={[
          '근태관리',
          '업무계획',
          '전자결재',
          '사원정보 설정',
          '부서이동 신청',
        ]}
        isLoggedIn={isLoggedIn}
        requireAuth={true}
        onClose={onClose}
      />
    </div>
  );
}

interface MenuSectionProps {
  icon: string;
  title: string;
  items: string[];
  isLoggedIn?: boolean;
  requireAuth?: boolean;
  onClose?: () => void;
}

function MenuSection({
  icon,
  title,
  items,
  isLoggedIn = false,
  requireAuth = false,
  onClose,
}: MenuSectionProps) {
  const router = useRouter();

  const handleItemClick = (item: string) => {
    // 로그인 필요한 메뉴인데 비로그인 상태면
    if (requireAuth && !isLoggedIn) {
      onClose?.();
      router.push('/login');
      return;
    }

    // TODO: 실제 라우팅 로직 추가
    console.log(`Navigate to: ${title} - ${item}`);
    onClose?.();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-1">
        <Icon icon={icon} className="w-5 h-5 text-grey-900 flex-shrink-0" />
        <h3 className="brand-h3 text-grey-900">{title}</h3>
      </div>

      {/* 메뉴 아이템 */}
      <ul className="flex flex-col gap-0">
        {items.map(item => (
          <li key={item}>
            <button
              onClick={() => handleItemClick(item)}
              className="w-full text-left py-1.5 px-0 body-sm font-medium text-grey-500 hover:text-grey-900 transition-colors"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
