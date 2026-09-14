import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ReportsService } from '../../../core/api/reports.service';
import { ProductReport } from '../../../core/models/report.model';
import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import { ReportPeriodFilter } from '../components/report-period-filter/report-period-filter';
import {
  AppliedReportPeriod,
  currentReportPeriod,
  ReportPeriod,
  toAppliedReportPeriod,
} from '../components/report-period-filter/report-period';

@Component({
  selector: 'product-report-page',
  imports: [BreadcrumbsNg, DecimalPipe, ReportPeriodFilter],
  templateUrl: './productos-reportes.page.html',
})
export default class ProductosReportesPage {
  private readonly reportsService = inject(ReportsService);

  protected readonly period = signal<ReportPeriod>(currentReportPeriod());
  protected readonly products = signal<ProductReport[] | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    const period = toAppliedReportPeriod(this.period());
    if (period) void this.load(period);
  }

  protected updatePeriod(period: ReportPeriod): void {
    this.period.set(period);
  }

  protected applyPeriod(period: AppliedReportPeriod): void {
    this.period.set({ startDate: period.startDate, endDate: period.endDate });
    void this.load(period);
  }

  protected retry(): void {
    const period = toAppliedReportPeriod(this.period());
    if (period) void this.load(period);
  }

  private async load(period: AppliedReportPeriod): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.products.set(
        await firstValueFrom(
          this.reportsService.findProducts({ from: period.from, to: period.to }),
        ),
      );
    } catch (error) {
      this.products.set(null);
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'Error inesperado');
  }
}
