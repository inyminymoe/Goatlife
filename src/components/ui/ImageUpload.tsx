'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Button from './Button';
import { Icon } from '@iconify/react';

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  disabled = false,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다. 서버 터져요ㅠㅠ');
      return;
    }

    // 이미지 미리보기
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onChange?.(result);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="ui-component flex flex-col gap-2 items-stretch">
      <label className="brand-h4 font-brand text-dark mb-2 md:mb-3 block">
        프로필 사진
      </label>

      <div className="flex flex-col items-start">
        {/* 이미지 미리보기 */}
        <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden mb-2 md:mb-3">
          {preview ? (
            <Image
              src={preview}
              alt="프로필 미리보기"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon
              icon="icon-park:user-business"
              width={56}
              height={56}
              className="text-grey-500"
            />
          )}
        </div>

        {/* 업로드 버튼 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleClick}
          disabled={disabled}
          className="w-24 justify-center"
        >
          업로드
        </Button>
      </div>
    </div>
  );
}
