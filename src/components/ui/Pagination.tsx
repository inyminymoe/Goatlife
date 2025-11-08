'use client';

import { Icon } from '@iconify/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= showPages; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      {/* 이전 버튼 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center text-grey-500 disabled:text-grey-300 disabled:cursor-not-allowed hover:text-grey-900 transition-colors"
        aria-label="이전 페이지"
      >
        <Icon
          icon="material-symbols:arrow-back-ios-rounded"
          className="size-6"
        />
      </button>

      {/* 페이지 번호 */}
      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-grey-400">
              …
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`size-6 flex items-center justify-center rounded text-base transition-colors ${
              currentPage === page
                ? 'text-primary-500 font-semibold'
                : 'text-grey-500 hover:text-grey-900'
            }`}
            aria-label={`${page}페이지`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* 다음 버튼 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center text-grey-500 disabled:text-grey-300 disabled:cursor-not-allowed hover:text-grey-900 transition-colors"
        aria-label="다음 페이지"
      >
        <Icon
          icon="material-symbols:arrow-forward-ios-rounded"
          className="size-6"
        />
      </button>
    </div>
  );
}
