import { redirect } from 'next/navigation';
import BoardPostForm from '@/components/features/board/BoardPostForm';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  COMPANY_BOARDS,
  getTagsByScope,
  isValidBoard,
  type BoardScope,
} from '@/constants/board';

export const dynamic = 'force-dynamic';

type BoardNewPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function resolveScope(rawScope: string | null): BoardScope {
  return rawScope === 'department' ? 'department' : 'company';
}

export default async function BoardNewPage({
  searchParams,
}: BoardNewPageProps) {
  const params = (await searchParams) ?? {};

  const scope = resolveScope(
    typeof params.scope === 'string' ? params.scope : null
  );
  const board =
    typeof params.board === 'string'
      ? params.board
      : typeof params.tboard === 'string'
        ? params.tboard
        : '';
  const dept = typeof params.dept === 'string' ? params.dept : '';

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (!isValidBoard(scope, board, dept)) {
    if (scope === 'company') {
      redirect(
        `/board?scope=company&board=${encodeURIComponent(COMPANY_BOARDS[0])}`
      );
    }
    redirect(
      `/board?scope=department${dept ? `&dept=${encodeURIComponent(dept)}` : ''}`
    );
  }

  const categoryOptions =
    scope === 'company' ? [...COMPANY_BOARDS] : dept ? [dept] : [];

  const availableTags = getTagsByScope(scope);

  return (
    <BoardPostForm
      scope={scope}
      board={scope === 'company' ? board : undefined}
      dept={scope === 'department' ? dept : undefined}
      availableTags={availableTags}
      categoryOptions={categoryOptions}
    />
  );
}
