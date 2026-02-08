'use client';
import { Provider as JotaiProvider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, useMemo, useState } from 'react';
import { userAtom } from '@/store/atoms';
import type { User } from '@/types/user';
import SupabaseAuthListener from '@/components/SupabaseAuthListener';
import { ToastProvider } from '@/providers/ToastProvider';

interface ProvidersProps {
  children: ReactNode;
  initialUser?: User | null;
}

function HydrateUser({ user }: { user: User | null }) {
  const values = useMemo(() => [[userAtom, user]] as const, [user]);
  useHydrateAtoms(values);
  return null;
}

export default function Providers({
  children,
  initialUser = null,
}: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  const hydratedUser = useMemo(() => initialUser ?? null, [initialUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <ToastProvider>
          <HydrateUser user={hydratedUser} />
          <SupabaseAuthListener />
          {children}
        </ToastProvider>
      </JotaiProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
