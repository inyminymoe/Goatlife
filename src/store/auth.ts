import { atom } from 'jotai';

interface User {
  id: string;
  email: string;
  name: string;
}

export const userAtom = atom<User | null>(null);
export const isLoadingAtom = atom(false);
