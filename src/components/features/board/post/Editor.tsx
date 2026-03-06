'use client';
import type {} from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { useAtom } from 'jotai';
import { editorAtom } from '@/store/editor';
import Link from '@tiptap/extension-link';

interface EditorProps {
  errorMessage?: string;
  onContentChange?: () => void;
}

export const Editor = ({ errorMessage, onContentChange }: EditorProps) => {
  const [, setEditor] = useAtom(editorAtom);

  const editor = useEditor({
    onCreate({ editor }) {
      setEditor(editor);
    },
    onDestroy() {
      setEditor(null);
    },
    onUpdate({ editor }) {
      setEditor(editor);
      onContentChange?.();
    },
    onSelectionUpdate({ editor }) {
      setEditor(editor);
    },
    onTransaction({ editor }) {
      setEditor(editor);
    },
    onFocus({ editor }) {
      setEditor(editor);
    },
    onBlur({ editor }) {
      setEditor(editor);
    },
    onContentError({ editor }) {
      setEditor(editor);
    },
    editorProps: {
      attributes: {
        class:
          'focus:outline-none w-full bg-transparent border-none outline-none resize-none text-base text-fixed-grey-900 placeholder:text-fixed-grey-300 min-h-[260px]',
      },
    },
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      FontSize,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Color,
      ImageResize,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
    ],
    content: '<p>갓생이들에게 전할 말 🐴</p>',
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <div>
      <EditorContent editor={editor} />
      {errorMessage && (
        <p className="mt-1 text-xs text-[#e26aff]">{errorMessage}</p>
      )}
    </div>
  );
};
