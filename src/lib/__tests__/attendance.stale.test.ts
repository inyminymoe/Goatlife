/**
 * 근태 stale session 관련 단위 테스트
 *
 * 테스트 대상:
 * - mapAttendanceRow: is_manual_close 매핑
 * - mapAttendanceError: session 에러 메시지 매핑
 * - getKstDateString / getKstHour: KST 변환 유틸
 * - normalizeAttendanceStatus: 상태 정규화
 */

import { describe, it, expect } from 'vitest';
import {
  mapAttendanceRow,
  mapAttendanceError,
  getKstDateString,
  getKstHour,
  normalizeAttendanceStatus,
  type AttendanceRow,
} from '../attendance';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<AttendanceRow> = {}): AttendanceRow {
  return {
    id: 'test-id',
    user_id: 'user-1',
    work_date: '2026-03-27',
    clock_in_at: '2026-03-27T00:00:00.000Z', // 09:00 KST
    early_leave_at: null,
    clock_out_at: null,
    work_minutes: null,
    note: null,
    status: 'present',
    is_manual_close: false,
    created_at: '2026-03-27T00:00:00.000Z',
    updated_at: '2026-03-27T00:00:00.000Z',
    ...overrides,
  };
}

// ── mapAttendanceRow ───────────────────────────────────────────────────────────

describe('mapAttendanceRow', () => {
  it('is_manual_close=false 인 경우 isManualClose=false 반환', () => {
    const row = makeRow({ is_manual_close: false });
    expect(mapAttendanceRow(row).isManualClose).toBe(false);
  });

  it('is_manual_close=true 인 경우 isManualClose=true 반환', () => {
    const row = makeRow({ is_manual_close: true });
    expect(mapAttendanceRow(row).isManualClose).toBe(true);
  });

  it('is_manual_close=null 인 경우 isManualClose=false 로 기본값 처리', () => {
    const row = makeRow({ is_manual_close: null });
    expect(mapAttendanceRow(row).isManualClose).toBe(false);
  });

  it('is_manual_close 필드가 없는 경우 isManualClose=false 로 기본값 처리', () => {
    const row = makeRow();
    delete (row as Partial<AttendanceRow>).is_manual_close;
    expect(mapAttendanceRow(row).isManualClose).toBe(false);
  });

  it('clock_out_at이 있으면 work_minutes 우선, 없으면 계산', () => {
    const row = makeRow({
      clock_in_at: '2026-03-27T00:00:00.000Z',
      clock_out_at: '2026-03-27T04:00:00.000Z', // 4시간
      work_minutes: null,
    });
    expect(mapAttendanceRow(row).workMinutes).toBe(240);
  });

  it('work_minutes가 있으면 그 값을 사용', () => {
    const row = makeRow({
      clock_in_at: '2026-03-27T00:00:00.000Z',
      clock_out_at: '2026-03-27T04:00:00.000Z',
      work_minutes: 999,
    });
    expect(mapAttendanceRow(row).workMinutes).toBe(999);
  });

  it('stale 세션 (clock_out_at=null, work_minutes=null) → workMinutes=0', () => {
    const row = makeRow({
      clock_in_at: '2026-03-27T00:00:00.000Z',
      clock_out_at: null,
      work_minutes: null,
    });
    expect(mapAttendanceRow(row).workMinutes).toBe(0);
  });
});

// ── mapAttendanceError ─────────────────────────────────────────────────────────

describe('mapAttendanceError', () => {
  it('"Session already closed" → ALREADY_FINALIZED', () => {
    expect(mapAttendanceError('Session already closed')).toBe(
      'ALREADY_FINALIZED'
    );
  });

  it('"session already closed" 소문자도 처리', () => {
    expect(mapAttendanceError('session already closed')).toBe(
      'ALREADY_FINALIZED'
    );
  });

  it('"Already clocked out" → ALREADY_FINALIZED', () => {
    expect(mapAttendanceError('Already clocked out')).toBe('ALREADY_FINALIZED');
  });

  it('"No clock-in record found for the given date" → NO_CHECK_IN_RECORD', () => {
    expect(
      mapAttendanceError('No clock-in record found for the given date')
    ).toBe('NO_CHECK_IN_RECORD');
  });

  it('"Already clocked in today" → ALREADY_CHECKED_IN', () => {
    expect(mapAttendanceError('Already clocked in today')).toBe(
      'ALREADY_CHECKED_IN'
    );
  });

  it('null 입력 → UNKNOWN', () => {
    expect(mapAttendanceError(null)).toBe('UNKNOWN');
  });

  it('undefined 입력 → UNKNOWN', () => {
    expect(mapAttendanceError(undefined)).toBe('UNKNOWN');
  });

  it('알 수 없는 메시지 → UNKNOWN', () => {
    expect(mapAttendanceError('random error message')).toBe('UNKNOWN');
  });
});

// ── getKstDateString ───────────────────────────────────────────────────────────

describe('getKstDateString', () => {
  it('UTC 자정은 KST 09:00이므로 같은 날짜 반환', () => {
    const utcMidnight = new Date('2026-03-27T00:00:00.000Z');
    expect(getKstDateString(utcMidnight)).toBe('2026-03-27');
  });

  it('UTC 14:59 = KST 23:59 → 같은 날', () => {
    const d = new Date('2026-03-27T14:59:00.000Z');
    expect(getKstDateString(d)).toBe('2026-03-27');
  });

  it('UTC 15:00 = KST 00:00 다음날 → 다음 날 반환', () => {
    const d = new Date('2026-03-27T15:00:00.000Z');
    expect(getKstDateString(d)).toBe('2026-03-28');
  });

  it('문자열 입력도 처리', () => {
    expect(getKstDateString('2026-03-27T00:00:00.000Z')).toBe('2026-03-27');
  });
});

// ── getKstHour ─────────────────────────────────────────────────────────────────

describe('getKstHour', () => {
  it('UTC 00:00 = KST 09:00 → 9', () => {
    expect(getKstHour(new Date('2026-03-28T00:00:00.000Z'))).toBe(9);
  });

  it('UTC 21:00 = KST 06:00 → 6 (stale 경계값)', () => {
    expect(getKstHour(new Date('2026-03-27T21:00:00.000Z'))).toBe(6);
  });

  it('UTC 20:59 = KST 05:59 → 5 (아직 carry-over 구간)', () => {
    expect(getKstHour(new Date('2026-03-27T20:59:00.000Z'))).toBe(5);
  });
});

// ── normalizeAttendanceStatus ──────────────────────────────────────────────────

describe('normalizeAttendanceStatus', () => {
  const baseRow: Pick<
    AttendanceRow,
    'clock_in_at' | 'clock_out_at' | 'early_leave_at' | 'note'
  > = {
    clock_in_at: '2026-03-27T00:00:00.000Z',
    clock_out_at: null,
    early_leave_at: null,
    note: null,
  };

  it('"present" → present', () => {
    expect(normalizeAttendanceStatus('present', baseRow)).toBe('present');
  });

  it('"late" → late', () => {
    expect(normalizeAttendanceStatus('late', baseRow)).toBe('late');
  });

  it('"early_leave" → early_leave', () => {
    expect(normalizeAttendanceStatus('early_leave', baseRow)).toBe(
      'early_leave'
    );
  });

  it('"vacation" → vacation', () => {
    expect(normalizeAttendanceStatus('vacation', baseRow)).toBe('vacation');
  });

  it('"absent" → absent', () => {
    expect(normalizeAttendanceStatus('absent', baseRow)).toBe('absent');
  });

  it('status=null, clock_in_at 있음 → present (정각 출근)', () => {
    // 09:00:00 KST = 00:00:00 UTC (지각 아님)
    expect(
      normalizeAttendanceStatus(null, {
        ...baseRow,
        clock_in_at: '2026-03-27T00:00:00.000Z',
      })
    ).toBe('present');
  });

  it('status=null, clock_in_at 없음 → absent', () => {
    expect(
      normalizeAttendanceStatus(null, {
        ...baseRow,
        clock_in_at: null,
      })
    ).toBe('absent');
  });
});
