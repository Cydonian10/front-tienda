import { DateTime } from 'luxon';

import { ReportRange } from '../../../../core/models/report.model';

const BUSINESS_TIME_ZONE = 'America/Lima';

export type ReportPeriod = {
  startDate: string;
  endDate: string;
};

export type AppliedReportPeriod = ReportPeriod & ReportRange;

export function currentReportPeriod(): ReportPeriod {
  const now = DateTime.now().setZone(BUSINESS_TIME_ZONE);
  return {
    startDate: now.startOf('week').toISODate()!,
    endDate: now.endOf('week').toISODate()!,
  };
}

export function toAppliedReportPeriod(period: ReportPeriod): AppliedReportPeriod | null {
  const start = DateTime.fromISO(period.startDate, { zone: BUSINESS_TIME_ZONE });
  const end = DateTime.fromISO(period.endDate, { zone: BUSINESS_TIME_ZONE });
  if (!start.isValid || !end.isValid || start > end) return null;

  return {
    ...period,
    from: start.startOf('day').toISO()!,
    to: end.endOf('day').toISO()!,
  };
}

export function periodForPreset(preset: 'today' | 'week' | 'month'): ReportPeriod {
  const now = DateTime.now().setZone(BUSINESS_TIME_ZONE);
  const start =
    preset === 'week' ? now.startOf('week') : preset === 'month' ? now.startOf('month') : now;
  const end = preset === 'week' ? now.endOf('week') : preset === 'month' ? now.endOf('month') : now;

  return {
    startDate: start.toISODate()!,
    endDate: end.toISODate()!,
  };
}
