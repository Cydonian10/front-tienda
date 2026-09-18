import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ReportsService } from '../../../core/api/reports.service';
import { SellerReport } from '../../../core/models/report.model';
import { RealtimeService } from '../../../core/realtime/realtime.service';
import type { RealtimeEvent } from '../../../core/realtime/realtime-event.model';
import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import { ReportPeriodFilter } from '../components/report-period-filter/report-period-filter';
import {
  AppliedReportPeriod,
  currentReportPeriod,
  ReportPeriod,
  toAppliedReportPeriod,
} from '../components/report-period-filter/report-period';

@Component({
  selector: 'seller-report-page',
  imports: [BreadcrumbsNg, DecimalPipe, ReportPeriodFilter],
  templateUrl: './vendedores-reportes.page.html',
})
export default class VendedoresReportesPage {
  private readonly reportsService = inject(ReportsService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly period = signal<ReportPeriod>(currentReportPeriod());
  protected readonly sellers = signal<SellerReport[] | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    const period = toAppliedReportPeriod(this.period());
    if (period) void this.load(period);
    this.destroyRef.onDestroy(
      this.realtimeService.onEvent((event) => this.handleRealtimeEvent(event)),
    );
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
      this.sellers.set(
        await firstValueFrom(this.reportsService.findSellers({ from: period.from, to: period.to })),
      );
    } catch (error) {
      this.sellers.set(null);
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent): void {
    if (event.name === 'sale.paid' || event.name === 'sale.cancelled') {
      this.reloadCurrentPeriod();
    }
  }

  private reloadCurrentPeriod(): void {
    const period = toAppliedReportPeriod(this.period());
    if (period) void this.load(period);
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'Error inesperado');
  }
}
