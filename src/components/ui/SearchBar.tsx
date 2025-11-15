'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface SearchBarProps {
  label: string;
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  label,
  onSearch,
  placeholder = '검색할 내용을 입력하세요.',
}: SearchBarProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = () => {
    onSearch(searchInput);
  };

  return (
    <div className="mx-auto flex justify-center items-center bg-white rounded-[5px] pl-4 pr-2 md:w-[642px]">
      <div className="hidden md:block text-sm text-grey-500 border-r pr-4 border-r-grey-300">
        {label}
      </div>
      <input
        type="text"
        value={searchInput}
        placeholder={placeholder}
        className="flex-1 text-sm text-fixed-grey-500 outline-none truncate px-2 py-2"
        onChange={e => setSearchInput(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        className="my-[5px] h-8 flex items-center justify-center"
        disabled={!searchInput.trim()}
        onClick={handleSearch}
      >
        검색
      </Button>
    </div>
  );
}
