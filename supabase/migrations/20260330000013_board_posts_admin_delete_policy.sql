-- Migration 013: board_posts 관리자 삭제 RLS 정책 추가
-- exec_admins에 등록된 임원은 모든 게시글을 삭제할 수 있도록 허용
-- (기존 "Allow delete own posts"는 author_id = auth.uid() 본인 삭제 전용)

CREATE POLICY "Allow delete by admin" ON public.board_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exec_admins
      WHERE user_id = auth.uid()
    )
  );
