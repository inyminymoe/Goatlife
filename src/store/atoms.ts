import { atom } from 'jotai';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  rank?: string;
  department?: string;
}

export const userAtom = atom<User | null>(null);
