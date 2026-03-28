/**
 * deriveAttendanceState — stale session 감지 로직 단위 테스트
 *
 * deriveAttendanceState는 useAttendance.ts 안에 private 함수이므로
 * 동일 로직을 여기에 재현해 테스트한다.
 * (실제 hook을 열어 export하지 않고 로직만 검증)
 *
 * TODO: 아래 재현 로직은 useAttendance.ts의 deriveAttendanceState와
 * 반드시 동기화 상태를 유지해야 합니다. 해당 함수 변경 시 이 파일도 함께 갱신하세요.
 * export를 통한 직접 import는 hook private 구현을 공개 API로 노출하는
 * 부작용이 있어 의도적으로 로직 복제 방식을 선택했습니다.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getKstDateString, calculateWorkMinutes } from '@/lib/attendance';
import type { AttendanceRecord } from '@/types/attendance';

// ── deriveAttendanceState 로직 재현 ───────────────────────────────────────────

type AttendanceOperationStatus =
  | 'before_work'
  | 'working'
  | 'completed'
  | 'stale_session';

type AttendanceViewState = {
  date: string | null;
  operationStatus: AttendanceOperationStatus;
  resultStatus: AttendanceRecord['status'] | null;
  clockInAt: string | null;
  earlyLeaveAt: string | null;
  clockOutAt: string | null;
  workMinutes: number;
};

const initialAttendanceState: AttendanceViewState = {
  date: null,
  operationStatus: 'before_work',
  resultStatus: null,
  clockInAt: null,
  earlyLeaveAt: null,
  clockOutAt: null,
  workMinutes: 0,
};

function deriveAttendanceState(
  record: AttendanceRecord | null
): AttendanceViewState {
  if (!record) return initialAttendanceState;

  const todayDate = getKstDateString();
  if (
    record.date < todayDate &&
    record.checkInAt !== null &&
    record.checkOutAt === null
  ) {
    return {
      date: record.date,
      operationStatus: 'stale_session',
      resultStatus: record.status,
      clockInAt: record.checkInAt,
      earlyLeaveAt: null,
      clockOutAt: null,
      workMinutes: 0,
    };
  }

  const completedAt = record.checkOutAt ?? record.earlyLeaveAt;
  return {
    date: record.date,
    operationStatus: completedAt
      ? 'completed'
      : record.checkInAt
        ? 'working'
        : 'before_work',
    resultStatus: record.status,
    clockInAt: record.checkInAt,
    earlyLeaveAt: record.earlyLeaveAt,
    clockOutAt: record.checkOutAt,
    workMinutes:
      record.workMinutes || calculateWorkMinutes(record.checkInAt, completedAt),
  };
}

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<AttendanceRecord> = {}
): AttendanceRecord {
  return {
    id: 'rec-1',
    userId: 'user-1',
    date: '2026-03-27',
    checkInAt: null,
    checkOutAt: null,
    earlyLeaveAt: null,
    workMinutes: 0,
    note: null,
    status: 'present',
    isManualClose: false,
    createdAt: '2026-03-27T00:00:00.000Z',
    updatedAt: '2026-03-27T00:00:00.000Z',
    ...overrides,
  };
}

// ── 오늘 날짜 모킹 헬퍼 ───────────────────────────────────────────────────────

function mockToday(dateStr: string) {
  // getKstDateString() = new Date() 기반이므로 Date를 고정
  const fixedDate = new Date(`${dateStr}T09:00:00+09:00`); // KST 09:00
  vi.setSystemTime(fixedDate);
}

afterEach(() => {
  vi.useRealTimers();
});

// ── 테스트 ────────────────────────────────────────────────────────────────────

describe('deriveAttendanceState', () => {
  // ── null 레코드 ─────────────────────────────────────────────────────────────
  describe('record=null', () => {
    it('null이면 before_work 초기 상태 반환', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(null);
      expect(state.operationStatus).toBe('before_work');
      expect(state.date).toBeNull();
    });
  });

  // ── 오늘 레코드 ─────────────────────────────────────────────────────────────
  describe('오늘 레코드', () => {
    it('오늘 clock_in만 있으면 working', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: '2026-03-28T00:00:00.000Z',
        })
      );
      expect(state.operationStatus).toBe('working');
    });

    it('오늘 clock_in + clock_out 있으면 completed', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: '2026-03-28T00:00:00.000Z',
          checkOutAt: '2026-03-28T09:00:00.000Z',
        })
      );
      expect(state.operationStatus).toBe('completed');
    });

    it('오늘 clock_in=null이면 before_work', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: null,
        })
      );
      expect(state.operationStatus).toBe('before_work');
    });

    it('earlyLeaveAt만 있어도 completed', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: '2026-03-28T00:00:00.000Z',
          earlyLeaveAt: '2026-03-28T05:00:00.000Z',
          checkOutAt: null,
        })
      );
      expect(state.operationStatus).toBe('completed');
    });
  });

  // ── stale session 판정 ──────────────────────────────────────────────────────
  describe('stale_session 판정', () => {
    it('어제 날짜 + clock_in 있음 + clock_out 없음 → stale_session', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27', // 어제
          checkInAt: '2026-03-27T00:00:00.000Z',
          checkOutAt: null,
        })
      );
      expect(state.operationStatus).toBe('stale_session');
    });

    it('stale_session: workMinutes=0 반환 (미처리이므로 계산 불가)', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27',
          checkInAt: '2026-03-27T00:00:00.000Z',
          checkOutAt: null,
        })
      );
      expect(state.workMinutes).toBe(0);
    });

    it('stale_session: clockInAt이 원본 그대로 반환됨', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const clockIn = '2026-03-27T00:15:00.000Z';
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27',
          checkInAt: clockIn,
          checkOutAt: null,
        })
      );
      expect(state.clockInAt).toBe(clockIn);
    });

    it('stale_session: earlyLeaveAt=null 반환', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27',
          checkInAt: '2026-03-27T00:00:00.000Z',
          earlyLeaveAt: '2026-03-27T05:00:00.000Z', // DB에 있더라도 stale에서는 null
          checkOutAt: null,
        })
      );
      expect(state.earlyLeaveAt).toBeNull();
      expect(state.operationStatus).toBe('stale_session');
    });

    it('어제 날짜지만 clock_out_at이 있으면 stale 아님 → completed', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27',
          checkInAt: '2026-03-27T00:00:00.000Z',
          checkOutAt: '2026-03-27T09:00:00.000Z',
        })
      );
      expect(state.operationStatus).toBe('completed');
    });

    it('어제 날짜지만 clock_in_at=null이면 stale 아님 → before_work', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-27',
          checkInAt: null,
          checkOutAt: null,
        })
      );
      expect(state.operationStatus).toBe('before_work');
    });

    it('이틀 전 미처리도 stale_session으로 처리됨', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-26', // 이틀 전
          checkInAt: '2026-03-26T00:00:00.000Z',
          checkOutAt: null,
        })
      );
      expect(state.operationStatus).toBe('stale_session');
    });

    it('오늘 날짜에 clock_out=null이면 stale 아님 → working', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28', // 오늘
          checkInAt: '2026-03-28T00:00:00.000Z',
          checkOutAt: null,
        })
      );
      expect(state.operationStatus).toBe('working');
    });
  });

  // ── workMinutes 계산 ────────────────────────────────────────────────────────
  describe('workMinutes 계산', () => {
    it('completed: work_minutes=0이면 clock_in~clock_out으로 재계산', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: '2026-03-28T00:00:00.000Z',
          checkOutAt: '2026-03-28T08:00:00.000Z', // 8시간
          workMinutes: 0,
        })
      );
      expect(state.workMinutes).toBe(480);
    });

    it('completed: work_minutes가 있으면 그 값 사용', () => {
      vi.useFakeTimers();
      mockToday('2026-03-28');
      const state = deriveAttendanceState(
        makeRecord({
          date: '2026-03-28',
          checkInAt: '2026-03-28T00:00:00.000Z',
          checkOutAt: '2026-03-28T08:00:00.000Z',
          workMinutes: 123,
        })
      );
      expect(state.workMinutes).toBe(123);
    });
  });
});
