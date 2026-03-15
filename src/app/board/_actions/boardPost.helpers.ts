import { isValidBoard, type BoardScope } from '@/constants/board';

export type BoardPostFieldErrors = Partial<
  Record<'title' | 'content' | 'hashtags' | 'category' | 'topic', string>
>;

export type BoardPostFields = {
  scopeValue: BoardScope;
  boardValue: string;
  deptValue: string;
  topicValue: string;
  titleValue: string;
  contentValue: string;
  hashtags: string[];
};

/** content HTML에서 Supabase Storage 이미지 URL 추출 */
export function extractImageUrls(content: string): string[] {
  return [
    ...content.matchAll(
      /src="(https?:\/\/[^"]*supabase[^"]*post-images[^"]*)"/g
    ),
  ].map(m => m[1]);
}

/** FormData에서 게시글 필드 파싱 + validation + 정규화를 한 번에 처리 */
export function parseBoardPostFormData(
  formData: FormData
):
  | { ok: true; fields: BoardPostFields }
  | { ok: false; error?: string; fieldErrors?: BoardPostFieldErrors } {
  const scope = formData.get('scope');
  const topic = formData.get('topic');
  const board = formData.get('board');
  const dept = formData.get('dept');
  const title = formData.get('title');
  const content = formData.get('content');
  const hashtagsRaw = formData.getAll('hashtags');

  const scopeValue =
    scope === 'company' || scope === 'department' ? scope : null;

  if (!scopeValue) {
    return { ok: false, error: '유효하지 않은 게시판 요청입니다.' };
  }

  // ── validation ─────────────────────────────────────────────────────────────
  const fieldErrors: BoardPostFieldErrors = {};

  if (scopeValue === 'company') {
    if (!board || typeof board !== 'string' || !board.trim()) {
      fieldErrors.category = '게시판 카테고리를 선택해주세요.';
    }
  }

  if (scopeValue === 'department') {
    if (!dept || typeof dept !== 'string' || !dept.trim()) {
      fieldErrors.category = '부서를 선택해주세요.';
    }
  }

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    fieldErrors.topic = '분류를 선택해주세요.';
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    fieldErrors.title = '제목을 입력해주세요.';
  }

  if (!content || typeof content !== 'string' || content.trim().length < 5) {
    fieldErrors.content = '본문은 5자 이상 입력해주세요.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  // ── 정규화 ─────────────────────────────────────────────────────────────────
  const boardValue = typeof board === 'string' ? board.trim() : '';
  const deptValue = typeof dept === 'string' ? dept.trim() : '';
  const topicValue = typeof topic === 'string' ? topic.trim() : '';
  const titleValue = title!.toString().trim();
  const contentValue = content!.toString().trim();
  const normalizedScope = scopeValue as BoardScope;

  const hashtags = Array.from(
    new Set(
      hashtagsRaw
        .map(tag => String(tag).trim().replace(/^#+/, ''))
        .filter(Boolean)
    )
  ).slice(0, 5);

  if (!isValidBoard(normalizedScope, boardValue, deptValue)) {
    return { ok: false, error: '유효하지 않은 게시판 정보입니다.' };
  }

  return {
    ok: true,
    fields: {
      scopeValue: normalizedScope,
      boardValue,
      deptValue,
      topicValue,
      titleValue,
      contentValue,
      hashtags,
    },
  };
}
