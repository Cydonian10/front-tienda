import { describe, expect, it } from 'vitest';

import { periodForPreset, toAppliedReportPeriod } from './report-period';

describe('report periods', () => {
  it('converts date inputs to inclusive America/Lima ISO limits', () => {
    expect(toAppliedReportPeriod({ startDate: '2026-09-12', endDate: '2026-09-14' })).toEqual({
      startDate: '2026-09-12',
      endDate: '2026-09-14',
      from: '2026-09-12T00:00:00.000-05:00',
      to: '2026-09-14T23:59:59.999-05:00',
    });
  });

  it('rejects invalid or inverted custom periods', () => {
    expect(toAppliedReportPeriod({ startDate: '2026-09-14', endDate: '2026-09-12' })).toBeNull();
    expect(toAppliedReportPeriod({ startDate: 'invalid', endDate: '2026-09-12' })).toBeNull();
  });

  it('returns complete ranges for supported presets', () => {
    for (const preset of ['today', 'week', 'month'] as const) {
      const period = periodForPreset(preset);
      expect(toAppliedReportPeriod(period)).not.toBeNull();
    }
  });
});
