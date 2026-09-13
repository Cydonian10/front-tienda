import { Component, input, output, signal } from '@angular/core';

import {
  AppliedReportPeriod,
  periodForPreset,
  ReportPeriod,
  toAppliedReportPeriod,
} from './report-period';

@Component({
  selector: 'report-period-filter',
  templateUrl: './report-period-filter.html',
  host: {
    class: 'block',
  },
})
export class ReportPeriodFilter {
  readonly period = input.required<ReportPeriod>();
  readonly disabled = input(false);
  readonly periodChanged = output<ReportPeriod>();
  readonly rangeApplied = output<AppliedReportPeriod>();
  protected readonly error = signal<string | null>(null);

  protected setPreset(preset: 'today' | 'week' | 'month'): void {
    this.apply(periodForPreset(preset));
  }

  protected update(key: keyof ReportPeriod, event: Event): void {
    this.periodChanged.emit({ ...this.period(), [key]: (event.target as HTMLInputElement).value });
  }

  protected applyCurrentPeriod(): void {
    this.apply(this.period());
  }

  private apply(period: ReportPeriod): void {
    const appliedPeriod = toAppliedReportPeriod(period);
    if (!appliedPeriod) {
      this.error.set('El inicio del período debe ser anterior o igual al final.');
      return;
    }

    this.error.set(null);
    this.periodChanged.emit(period);
    this.rangeApplied.emit(appliedPeriod);
  }
}
