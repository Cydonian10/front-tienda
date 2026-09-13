import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DateTime } from 'luxon';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { ReportsService } from '../../../../core/api/reports.service';
import { SalesService } from '../../../../core/api/sales.service';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import { SalesSummary } from '../../../../core/models/report.model';
import { ROLE_NAMES } from '../../../../core/models/role.model';
import { Sale, SaleFilter } from '../../../../core/models/sale.model';
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { openSaleCancellationDialog } from '../../dialogs/sale-cancellation-dialog';
import { openSaleDetailDialog } from '../../dialogs/sale-detail-dialog';
import { SalesFilters, SalesHistoryFilters } from '../components/sales-filters/sales-filters';
import { SalesHistoryTable } from '../components/sales-history-table/sales-history-table';
import { SalesSummaryComponent } from '../components/sales-summary/sales-summary';

const BUSINESS_TIME_ZONE = 'America/Lima';
type PeriodPreset = 'today' | 'week' | 'month' | 'custom';
type PeriodRange = { from: string; to: string };

@Component({
  selector: 'sales-history-page',
  imports: [BreadcrumbsNg, PaginationNg, SalesFilters, SalesHistoryTable, SalesSummaryComponent],
  templateUrl: './historial-ventas.page.html',
})
export default class HistorialVentasPage {
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly reportsService = inject(ReportsService);
  private readonly salesService = inject(SalesService);
  private readonly authStore = inject(AuthStore);

  protected readonly filters = signal<SalesHistoryFilters>(this.defaultFilters());
  protected readonly periodPreset = signal<PeriodPreset>('today');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly sales = signal<PaginatedResult<Sale> | null>(null);
  protected readonly summary = signal<SalesSummary | null>(null);
  protected readonly isLoadingTable = signal(true);
  protected readonly isLoadingSummary = signal(true);
  protected readonly tableError = signal<string | null>(null);
  protected readonly summaryError = signal<string | null>(null);
  protected readonly periodError = signal<string | null>(null);
  protected readonly isSummaryEmpty = computed(() => {
    const summary = this.summary();
    return !!summary && summary.paidCount === 0 && summary.cancelledCount === 0;
  });
  protected readonly currentPersonId = computed(() => this.authStore.person()?.id ?? null);
  protected readonly canCancelPaid = computed(
    () =>
      this.authStore
        .user()
        ?.roles.some(
          (role) => role === ROLE_NAMES.ADMINISTRATOR || role === ROLE_NAMES.RESPONSIBLE,
        ) ?? false,
  );
  protected readonly canCancelAnyPending = computed(
    () => this.authStore.user()?.roles.includes(ROLE_NAMES.ADMINISTRATOR) ?? false,
  );
  protected readonly today = computed(() =>
    DateTime.now().setZone(BUSINESS_TIME_ZONE).toISODate()!,
  );
  protected readonly isNextDayDisabled = computed(
    () => this.periodPreset() !== 'today' || this.filters().startDate >= this.today(),
  );
  protected readonly periodLabel = computed(() => {
    const { startDate, endDate } = this.filters();
    return startDate === endDate ? startDate : `${startDate} al ${endDate}`;
  });

  constructor() {
    void this.loadPeriod();
  }

  protected setPeriod(preset: Exclude<PeriodPreset, 'custom'>): void {
    const now = DateTime.now().setZone(BUSINESS_TIME_ZONE);
    const start =
      preset === 'week'
        ? now.startOf('week')
        : preset === 'month'
          ? now.startOf('month')
          : now.startOf('day');
    const end =
      preset === 'week'
        ? now.endOf('week')
        : preset === 'month'
          ? now.endOf('month')
          : now.endOf('day');
    this.periodPreset.set(preset);
    this.filters.update((filters) => ({
      ...filters,
      startDate: start.toISODate()!,
      endDate: end.toISODate()!,
    }));
    this.page.set(1);
    void this.loadPeriod();
  }

  protected previousDay(): void {
    const current = DateTime.fromISO(this.filters().startDate, { zone: BUSINESS_TIME_ZONE });
    this.setDay(current.minus({ days: 1 }));
  }

  protected nextDay(): void {
    if (this.isNextDayDisabled()) return;
    const current = DateTime.fromISO(this.filters().startDate, { zone: BUSINESS_TIME_ZONE });
    const next = current.plus({ days: 1 });
    if (next.toISODate()! > this.today()) return;
    this.setDay(next);
  }

  protected updateFilters(patch: Partial<SalesHistoryFilters>): void {
    if (patch.startDate !== undefined || patch.endDate !== undefined) {
      this.periodPreset.set('custom');
    }
    this.filters.update((filters) => ({ ...filters, ...patch }));
  }

  protected applyFilters(): void {
    this.page.set(1);
    void this.loadPeriod();
  }

  protected clearFilters(): void {
    this.filters.set(this.defaultFilters());
    this.periodPreset.set('today');
    this.page.set(1);
    void this.loadPeriod();
  }

  protected changePage(page: number): void {
    this.page.set(page);
    const range = this.periodRange();
    if (range) void this.loadTable(range);
  }

  protected changePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    const range = this.periodRange();
    if (range) void this.loadTable(range);
  }

  protected retryTable(): void {
    const range = this.periodRange();
    if (range) void this.loadTable(range);
  }

  protected retrySummary(): void {
    const range = this.periodRange();
    if (range) void this.loadSummary(range);
  }

  protected editSale(sale: Sale): void {
    void this.router.navigate(['/ventas/nueva'], { state: { sale } });
  }

  protected paySale(sale: Sale): void {
    void this.router.navigate(['/ventas/nueva'], { state: { sale, collect: true } });
  }

  protected showDetail(sale: Sale): void {
    openSaleDetailDialog(this.dialog, sale);
  }

  protected cancelSale(sale: Sale): void {
    const ref = openSaleCancellationDialog(this.dialog, sale);
    ref.closed.subscribe((cancelledSale) => {
      if (!cancelledSale) return;
      toast.success('Venta cancelada correctamente');
      void this.loadPeriod();
    });
  }

  private setDay(date: DateTime): void {
    const day = date.toISODate()!;
    this.periodPreset.set('today');
    this.filters.update((filters) => ({ ...filters, startDate: day, endDate: day }));
    this.page.set(1);
    void this.loadPeriod();
  }

  private async loadPeriod(): Promise<void> {
    const range = this.periodRange();
    if (!range) return;
    await Promise.all([this.loadTable(range), this.loadSummary(range)]);
  }

  private async loadTable(range: PeriodRange): Promise<void> {
    this.isLoadingTable.set(true);
    this.tableError.set(null);
    try {
      this.sales.set(await firstValueFrom(this.salesService.findAll(this.saleFilter(range))));
    } catch (error) {
      this.sales.set(null);
      this.tableError.set(this.message(error));
    } finally {
      this.isLoadingTable.set(false);
    }
  }

  private async loadSummary(range: PeriodRange): Promise<void> {
    this.isLoadingSummary.set(true);
    this.summaryError.set(null);
    try {
      this.summary.set(
        await firstValueFrom(this.reportsService.findSalesSummary(range.from, range.to)),
      );
    } catch (error) {
      this.summary.set(null);
      this.summaryError.set(this.message(error));
    } finally {
      this.isLoadingSummary.set(false);
    }
  }

  private periodRange(): PeriodRange | null {
    const { startDate, endDate } = this.filters();
    const start = DateTime.fromISO(startDate, { zone: BUSINESS_TIME_ZONE });
    const end = DateTime.fromISO(endDate, { zone: BUSINESS_TIME_ZONE });
    if (!start.isValid || !end.isValid || start > end) {
      this.periodError.set('El inicio del período debe ser anterior o igual al final.');
      return null;
    }
    this.periodError.set(null);
    return {
      from: start.startOf('day').toISO()!,
      to: end.endOf('day').toISO()!,
    };
  }

  private saleFilter(range: PeriodRange): SaleFilter {
    const filters = this.filters();
    return {
      page: this.page(),
      limit: this.pageSize(),
      status: filters.status || undefined,
      cashOpeningId: this.positiveInteger(filters.cashOpeningId),
      sellerId: this.positiveInteger(filters.sellerId),
      startDate: range.from,
      endDate: range.to,
    };
  }

  private defaultFilters(): SalesHistoryFilters {
    const today = DateTime.now().setZone(BUSINESS_TIME_ZONE).toISODate()!;
    return { status: '', cashOpeningId: '', sellerId: '', startDate: today, endDate: today };
  }

  private positiveInteger(value: string): number | undefined {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : undefined;
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'Error inesperado');
  }
}
