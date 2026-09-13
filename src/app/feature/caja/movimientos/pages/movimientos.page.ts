import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CashMovementsService } from '../../../../core/api/cash-movements.service';
import {
  CashMovement,
  CashMovementFilter,
  CashMovementType,
} from '../../../../core/models/cash-movement.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { BusinessDatePipe } from '../../../../shared/pipes/business-date.pipe';

interface MovementFilters {
  cashOpeningId: string;
  cashRegisterId: string;
  type: CashMovementType | '';
  createdById: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'cash-movements-page',
  imports: [BreadcrumbsNg, BusinessDatePipe, DecimalPipe, PaginationNg],
  templateUrl: './movimientos.page.html',
})
export default class MovimientosPage {
  private readonly movementsService = inject(CashMovementsService);

  protected readonly filters = signal<MovementFilters>(this.defaultFilters());
  protected readonly page = signal(1);
  protected readonly pageSize = signal(20);
  protected readonly movements = signal<PaginatedResult<CashMovement> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  protected updateFilter(key: keyof MovementFilters, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filters.update((filters) => ({ ...filters, [key]: value }));
  }

  protected applyFilters(): void {
    this.page.set(1);
    void this.load();
  }

  protected clearFilters(): void {
    this.filters.set(this.defaultFilters());
    this.page.set(1);
    void this.load();
  }

  protected changePage(page: number): void {
    this.page.set(page);
    void this.load();
  }

  protected changePageSize(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    void this.load();
  }

  protected typeLabel(type: CashMovementType): string {
    return type === 'income' ? 'Ingreso' : 'Egreso';
  }

  protected async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      this.movements.set(
        await firstValueFrom(this.movementsService.findAll(this.movementFilter())),
      );
    } catch (error) {
      this.movements.set(null);
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private movementFilter(): CashMovementFilter {
    const filters = this.filters();
    return {
      page: this.page(),
      limit: this.pageSize(),
      cashOpeningId: this.positiveInteger(filters.cashOpeningId),
      cashRegisterId: this.positiveInteger(filters.cashRegisterId),
      type: filters.type || undefined,
      createdById: this.positiveInteger(filters.createdById),
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };
  }

  private defaultFilters(): MovementFilters {
    return {
      cashOpeningId: '',
      cashRegisterId: '',
      type: '',
      createdById: '',
      startDate: '',
      endDate: '',
    };
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
