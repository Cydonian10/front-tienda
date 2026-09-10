import { describe, expect, it } from 'vitest';
import { BusinessDatePipe } from './business-date.pipe';

describe('BusinessDatePipe', () => {
  const pipe = new BusinessDatePipe();

  it('displays UTC instants in the America/Lima business timezone', () => {
    expect(pipe.transform('2026-09-10T03:19:00.000Z')).toBe('09/09/2026, 22:19');
  });

  it('returns an empty value for a missing or invalid timestamp', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('not-a-date')).toBe('');
  });
});
