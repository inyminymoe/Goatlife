import { atom } from 'jotai';
import { Editor } from '@tiptap/react';

export const editorAtom = atom<Editor | null>(null);
