import Button from '@/components/ui/Button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/Dropdown';
import Input from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { editorAtom } from '@/store/editor';
import { Icon } from '@iconify/react';
import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { SketchPicker, type ColorResult } from 'react-color';

export const Toolbar = () => {
  const editor = useAtomValue(editorAtom);

  if (!editor) {
    return null;
  }

  const TOOLBAR_ACTIONS = [
    {
      icon: 'material-symbols:format-bold-rounded',
      label: 'Bold',
      isActive: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: 'material-symbols:format-italic-rounded',
      label: 'Italic',
      isActive: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: 'material-symbols:format-underlined-rounded',
      label: 'Underline',
      isActive: editor.isActive('underline'),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      icon: 'material-symbols:format-strikethrough-rounded',
      label: 'Strike',
      isActive: editor.isActive('strike'),
      onClick: () => editor.chain().focus().toggleStrike().run(),
    },
  ];

  return (
    <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
      <ImageButton />
      {TOOLBAR_ACTIONS.map(item => (
        <ToolbarButton key={item.label} {...item} />
      ))}
      <HighlightColorButton />
      <TextColorButton />
      <FontSizeButton />
      <LinkButton />
    </div>
  );
};

const FontSizeButton = () => {
  const editor = useAtomValue(editorAtom);

  const sizes = [
    { label: '작게', value: 14 },
    { label: '보통', value: 16 },
    { label: '크게', value: 18 },
  ];

  const item = {
    icon: 'material-symbols:format-size-rounded',
    label: '사이즈',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton {...item} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-1 flex flex-col gap-y-1 w-14">
        {sizes.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            className={cn(
              'flex items-center gap-x-2 px-2 py-1 rounded-sm hover:bg-neutral-200/80'
            )}
            onClick={() => {
              editor?.chain().focus().setFontSize(`${value}px`).run();
            }}
          >
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const HighlightColorButton = () => {
  const editor = useAtomValue(editorAtom);

  const value = editor?.getAttributes('highlight').color || '#FFFFFF';

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setHighlight({ color: color.hex }).run();
  };

  const item = {
    icon: 'material-symbols:format-color-fill-rounded',
    label: '배경색',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton {...item} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0">
        <SketchPicker color={value} onChange={onChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TextColorButton = () => {
  const editor = useAtomValue(editorAtom);

  const value = editor?.getAttributes('textStyle').color || '#000000';

  const onChange = (color: ColorResult) => {
    editor?.chain().focus().setColor(color.hex).run();
  };

  const item = {
    icon: 'material-symbols:format-paint-rounded',
    label: '텍스트색',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex flex-col items-center gap-1 px-2 py-1 rounded-[4px] hover:bg-grey-100 transition-colors'
          )}
        >
          <Icon icon={item.icon} className="w-5 h-5 text-fixed-grey-900" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0">
        <SketchPicker color={value} onChange={onChange} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const ImageButton = () => {
  const editor = useAtomValue(editorAtom);
  const onChange = (src: string) => {
    editor?.chain().focus().setImage({ src }).run();
  };

  const onUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        onChange(imageUrl);
      }
    };

    input.click();
  };

  const item = {
    icon: 'material-symbols:imagesmode-outline',
    label: '이미지 첨부',
    onClick: onUpload,
  };
  return <ToolbarButton {...item} />;
};

const LinkButton = () => {
  const editor = useAtomValue(editorAtom);

  const [value, setValue] = useState('');

  const onChange = (href: string) => {
    editor?.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setValue('');
  };

  const item = { icon: 'material-symbols:link-rounded', label: '링크 첨부' };

  return (
    <DropdownMenu
      onOpenChange={open => {
        if (open) {
          setValue(editor?.getAttributes('link').href || '');
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <ToolbarButton {...item} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2.5 flex items-center gap-x-2">
        <Input
          className="min-w-[200px]"
          placeholder="https://example.com"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
        <Button onClick={() => onChange(value)} size="sm" className="w-16 h-10">
          적용
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface ToolbarButtonProps {
  onClick?: () => void;
  isActive?: boolean;
  icon: string;
}

const ToolbarButton = ({ onClick, isActive, icon }: ToolbarButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-[4px] hover:bg-grey-100 transition-colors',
        isActive ? 'bg-grey-100' : null
      )}
    >
      <Icon icon={icon} className="w-5 h-5 text-fixed-grey-900" />
    </button>
  );
};
