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
    <div className="mx-auto flex justify-center items-center bg-white rounded-[5px] pl-[15px] pr-[5px] md:w-[642px]">
      <div className="text-sm text-grey-500 border-r pr-[30px] border-r-grey-300">
        {label}
      </div>
      <input
        type="text"
        value={searchInput}
        placeholder={placeholder}
        className="flex-1 text-sm outline-none ml-[15px] truncate"
        onChange={e => setSearchInput(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        className="my-[5px] h-8"
        disabled={!searchInput.trim()}
        onClick={handleSearch}
      >
        검색
      </Button>
    </div>
  );
}
