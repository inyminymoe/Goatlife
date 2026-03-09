'use client';

import { Icon } from '@iconify/react';

interface FileAttachProps {
  files: File[];
  onAdd: (files: File[]) => void;
  onRemove: (file: File) => void;
}

export function FileAttach({ files, onAdd, onRemove }: FileAttachProps) {
  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt';
    input.onchange = e => {
      const selected = Array.from((e.target as HTMLInputElement).files ?? []);
      onAdd(selected);
    };
    input.click();
  };

  return (
    <div className="rounded-[5px] border border-dashed border-grey-200 bg-grey-50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          {files.length === 0 ? (
            <p className="text-grey-400 body-sm">첨부 파일 없음</p>
          ) : (
            files.map(file => (
              <div
                key={`${file.name}-${file.size}`}
                className="flex items-center gap-2 text-grey-700 body-sm"
              >
                <Icon
                  icon="material-symbols:attach-file"
                  className="w-4 h-4 shrink-0"
                />
                <span className="truncate">{file.name}</span>
                <span className="text-grey-400 text-xs shrink-0">
                  ({(file.size / 1024).toFixed(1)}KB)
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(file)}
                  className="ml-auto text-grey-400 hover:text-grey-700"
                >
                  <Icon icon="material-symbols:close" className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleFileAttach}
          className="shrink-0 flex items-center gap-1 text-grey-500 hover:text-grey-900 body-sm transition-colors"
        >
          <Icon icon="material-symbols:attach-file" className="w-4 h-4" />
          <span>파일 추가</span>
        </button>
      </div>
    </div>
  );
}
