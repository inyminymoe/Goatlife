/**
 * getAttendanceToday — stale session 감지 경로 단위 테스트
 *
 * getAttendanceToday 내부의 carry-over / stale 분기 로직을 순수 함수(resolveActiveRow)로
 * 추출하여 Supabase 의존성 없이 경계값(KST 06:00)과 상태 전환을 검증한다.
 */

import { describe, it, expect } from 'vitest';
import type { AttendanceRow } from '@/lib/attendance';
import { getKstDateString } from '@/lib/attendance';

// ── stale 감지 로직 재현 ────────────────────────────────────────────────────
// getAttendanceToday 내부의 carry-over / stale 분기를 순수 함수로 추출해 검증

function resolveActiveRow(
  rows: AttendanceRow[],
  today: string,
  yesterday: string,
  currentKstHour: number
): {
  type: 'today' | 'carryOver' | 'stale' | 'none';
  row: AttendanceRow | null;
} {
  const todayRow = rows.find(r => r.work_date === today) ?? null;

  if (todayRow) return { type: 'today', row: todayRow };

  const activeCarryOverRow =
    rows.find(row => {
      if (row.work_date !== yesterday || !row.clock_in_at) return false;
      if (row.clock_out_at !== null)
        return getKstDateString(row.clock_out_at) === today;
      return currentKstHour < 6;
    }) ?? null;

  if (activeCarryOverRow) return { type: 'carryOver', row: activeCarryOverRow };

  const staleRow =
    currentKstHour >= 6
      ? (rows.find(
          r =>
            r.work_date === yesterday &&
            r.clock_in_at !== null &&
            r.clock_out_at === null
        ) ?? null)
      : null;

  if (staleRow) return { type: 'stale', row: staleRow };

  return { type: 'none', row: null };
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<AttendanceRow> = {}): AttendanceRow {
  return {
    id: 'row-1',
    user_id: 'u1',
    work_date: '2026-03-27',
    clock_in_at: '2026-03-27T00:00:00.000Z',
    early_leave_at: null,
    clock_out_at: null,
    work_minutes: 0,
    note: null,
    status: 'present',
    is_manual_close: null,
    created_at: '2026-03-27T00:00:00.000Z',
    updated_at: '2026-03-27T00:00:00.000Z',
    ...overrides,
  };
}

const TODAY = '2026-03-28';
const YESTERDAY = '2026-03-27';

// ── 테스트 ────────────────────────────────────────────────────────────────────

describe('getAttendanceToday 분기 로직', () => {
  describe('오늘 레코드 우선', () => {
    it('오늘 레코드가 있으면 today 반환', () => {
      const rows = [makeRow({ work_date: TODAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 9);
      expect(result.type).toBe('today');
    });

    it('오늘 + 어제 stale 동시 존재 → 오늘 우선', () => {
      const rows = [
        makeRow({ work_date: TODAY }),
        makeRow({ work_date: YESTERDAY, clock_out_at: null }),
      ];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 10);
      expect(result.type).toBe('today');
      expect(result.row?.work_date).toBe(TODAY);
    });
  });

  describe('자정 carry-over (KST 06:00 이전)', () => {
    it('KST 05:59, 어제 clock_out=null → carryOver', () => {
      const rows = [makeRow({ work_date: YESTERDAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 5); // hour < 6
      expect(result.type).toBe('carryOver');
    });

    it('KST 00:00, 어제 clock_out이 오늘 날짜 → carryOver', () => {
      // 자정 넘겨 퇴근: clock_out_at의 KST 날짜가 오늘
      const clockOutKstToday = `${TODAY}T00:01:00+09:00`; // 오늘 0시 1분 KST
      const rows = [
        makeRow({
          work_date: YESTERDAY,
          clock_out_at: new Date(clockOutKstToday).toISOString(),
        }),
      ];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 0);
      expect(result.type).toBe('carryOver');
    });

    it('KST 00:00, 어제 clock_out이 어제 날짜 → carryOver 아님 (정상 퇴근)', () => {
      const rows = [
        makeRow({
          work_date: YESTERDAY,
          clock_out_at: '2026-03-27T10:00:00.000Z', // 어제 퇴근
        }),
      ];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 0);
      expect(result.type).toBe('none'); // 오늘 레코드 없음, carryOver 조건 불충족
    });
  });

  describe('stale session (KST 06:00 이후)', () => {
    it('KST 06:00, 어제 clock_out=null → stale', () => {
      const rows = [makeRow({ work_date: YESTERDAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 6); // hour === 6
      expect(result.type).toBe('stale');
    });

    it('KST 09:00, 어제 clock_out=null → stale', () => {
      const rows = [makeRow({ work_date: YESTERDAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 9);
      expect(result.type).toBe('stale');
    });

    it('KST 23:00, 어제 clock_out=null → stale', () => {
      const rows = [makeRow({ work_date: YESTERDAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 23);
      expect(result.type).toBe('stale');
    });

    it('KST 05:59, 어제 clock_out=null → stale 아님 (carry-over)', () => {
      const rows = [makeRow({ work_date: YESTERDAY, clock_out_at: null })];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 5);
      expect(result.type).toBe('carryOver'); // stale이 아니라 carry-over
    });

    it('stale: 어제 레코드가 없으면 none', () => {
      const result = resolveActiveRow([], TODAY, YESTERDAY, 10);
      expect(result.type).toBe('none');
    });

    it('stale: 어제 clock_in=null이면 stale 아님', () => {
      const rows = [
        makeRow({
          work_date: YESTERDAY,
          clock_in_at: null,
          clock_out_at: null,
        }),
      ];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 10);
      expect(result.type).toBe('none');
    });

    it('stale: 어제 clock_out이 있으면 stale 아님', () => {
      const rows = [
        makeRow({
          work_date: YESTERDAY,
          clock_in_at: '2026-03-27T00:00:00.000Z',
          clock_out_at: '2026-03-27T09:00:00.000Z',
        }),
      ];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 10);
      expect(result.type).toBe('none');
    });

    it('stale row의 내용이 정확히 반환됨', () => {
      const staleRow = makeRow({
        work_date: YESTERDAY,
        clock_in_at: '2026-03-27T00:15:00.000Z', // 09:15 KST
        clock_out_at: null,
      });
      const rows = [staleRow];
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 9);
      expect(result.type).toBe('stale');
      expect(result.row?.clock_in_at).toBe('2026-03-27T00:15:00.000Z');
    });
  });

  describe('레코드 없음', () => {
    it('rows가 비어있으면 none', () => {
      const result = resolveActiveRow([], TODAY, YESTERDAY, 9);
      expect(result.type).toBe('none');
    });

    it('어제/오늘 외 날짜만 있어도 none', () => {
      const rows = [makeRow({ work_date: '2026-03-25' })]; // 그저께
      const result = resolveActiveRow(rows, TODAY, YESTERDAY, 9);
      expect(result.type).toBe('none');
    });
  });
});
