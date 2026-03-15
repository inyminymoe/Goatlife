'use client';

import { useEffect, useState } from 'react';
import { useExecQuotes } from '@/hooks/useExecQuotes';
import { z } from 'zod';

const FormSchema = z.object({
  author_code: z.string().min(1).default('exec'),
  author_name: z.string().min(1, '이름을 입력해주세요'),
  author_title: z.enum(['CEO', 'CTO', 'COO']),
  avatar_url: z
    .string()
    .url('올바른 URL을 입력해주세요')
    .optional()
    .or(z.literal(''))
    .transform(v => v || undefined),
  message: z
    .string()
    .min(1, '메시지를 입력해주세요')
    .max(500, '최대 500자까지 입력 가능합니다'),
  lang: z.string().default('ko'),
  is_explicit: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

type FormData = z.input<typeof FormSchema>;

export default function ExecQuotesAdmin() {
  const { data, fetchList, add, patch, remove, loading } = useExecQuotes();
  const [form, setForm] = useState<FormData>({
    author_code: 'exec',
    author_name: '',
    author_title: 'CEO',
    avatar_url: '',
    message: '',
    lang: 'ko',
    is_explicit: false,
    is_active: true,
  });
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = FormSchema.parse(form);
      await add(payload);
      setForm({
        author_code: 'exec',
        author_name: '',
        author_title: 'CEO',
        avatar_url: '',
        message: '',
        lang: 'ko',
        is_explicit: false,
        is_active: true,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError('명언 추가에 실패했습니다.');
        console.error('[ExecQuotesAdmin] onCreate failed', err);
      }
    }
  };

  const onSearch = () => {
    void fetchList({ q, page: 1 });
  };

  const onToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await patch(id, { is_active: !currentActive });
    } catch (err) {
      console.error('[ExecQuotesAdmin] onToggleActive failed', err);
      alert('활성화 상태 변경에 실패했습니다.');
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await remove(id);
    } catch (err) {
      console.error('[ExecQuotesAdmin] onDelete failed', err);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end gap-3">
        <h2 className="brand-h3 text-grey-900">임원진 명언 관리</h2>
        <div className="ml-auto flex gap-2">
          <input
            className="border border-grey-200 rounded px-3 py-1 text-sm"
            placeholder="메시지 검색"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSearch()}
          />
          <button
            className="outline outline-1 outline-grey-300 rounded px-3 py-1 text-sm hover:bg-grey-50"
            onClick={onSearch}
            disabled={loading}
          >
            검색
          </button>
        </div>
      </header>

      {/* 생성 폼 */}
      <form
        onSubmit={onCreate}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end outline outline-1 outline-grey-200 p-4 rounded bg-dark"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs text-grey-600">이름</label>
          <input
            className="border border-grey-200 rounded px-3 py-2 text-sm"
            placeholder="갓끼"
            value={form.author_name}
            onChange={e => setForm({ ...form, author_name: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-grey-600">직책</label>
          <select
            className="border border-grey-200 rounded px-3 py-2 text-sm"
            value={form.author_title}
            onChange={e =>
              setForm({
                ...form,
                author_title: e.target.value as 'CEO' | 'CTO' | 'COO',
              })
            }
          >
            <option value="CEO">CEO</option>
            <option value="CTO">CTO</option>
            <option value="COO">COO</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 md:col-span-3">
          <label className="text-xs text-grey-600">메시지 (최대 500자)</label>
          <textarea
            className="border border-grey-200 rounded px-3 py-2 text-sm resize-none"
            placeholder="일찍 일어나는 새는 수업가서 존다. 8시간 이상 숙면🩷"
            rows={3}
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs text-grey-600">아바타 URL (옵션)</label>
          <input
            className="border border-grey-200 rounded px-3 py-2 text-sm"
            placeholder="https://example.com/avatar.jpg"
            value={form.avatar_url}
            onChange={e => setForm({ ...form, avatar_url: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
          />
          <label htmlFor="is_active" className="text-sm text-grey-700">
            활성화
          </label>
        </div>
        {error && (
          <div className="md:col-span-3 text-sm text-red-500">{error}</div>
        )}
        <button
          type="submit"
          className="md:col-span-3 bg-grey-900 text-white rounded px-4 py-2 text-sm hover:bg-grey-800 disabled:opacity-50"
          disabled={loading}
        >
          추가
        </button>
      </form>

      {/* 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-grey-700">
            전체 {data.total}개
          </h3>
        </div>
        {loading && data.items.length === 0 ? (
          <div className="text-sm text-grey-500 text-center py-8">
            로딩 중...
          </div>
        ) : data.items.length === 0 ? (
          <div className="text-sm text-grey-500 text-center py-8">
            데이터가 없습니다.
          </div>
        ) : (
          <ul className="space-y-3">
            {data.items.map(q => (
              <li
                key={q.id}
                className="p-4 rounded outline outline-1 outline-grey-200 bg-dark"
              >
                <div className="flex items-center gap-2 mb-2">
                  <strong className="text-sm font-medium text-grey-900">
                    {q.author_name}
                  </strong>
                  <span className="text-xs px-2 py-0.5 rounded bg-grey-100 text-grey-700">
                    {q.author_title}
                  </span>
                  <span
                    className={`text-xs ml-2 ${
                      q.is_active ? 'text-green-600' : 'text-grey-400'
                    }`}
                  >
                    {q.is_active ? '활성' : '비활성'}
                  </span>
                  <div className="ml-auto flex gap-2">
                    <button
                      className="outline outline-1 outline-grey-300 rounded px-3 py-1 text-xs hover:bg-grey-50"
                      onClick={() => onToggleActive(q.id, q.is_active)}
                    >
                      {q.is_active ? '비활성화' : '활성화'}
                    </button>
                    <button
                      className="outline outline-1 outline-red-300 rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(q.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <p className="text-sm text-grey-700 whitespace-pre-line break-words">
                  {q.message}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
