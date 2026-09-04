import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import {
  catchError,
  combineLatest,
  debounceTime,
  EMPTY,
  finalize,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import { toast } from 'ngx-sonner';

import { MeasurementUnitsService } from '../../../../core/api/measurement-units.service';
import { MeasurementUnit } from '../../../../core/models/measurement-unit.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../shared/icon/icon';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { MeasurementUnitsSearch } from '../components/measurement-units-search/measurement-units-search.component';
import { MeasurementUnitsTable } from '../components/measurement-units-table/measurement-units-table.component';
import { openMeasurementUnitDialog } from '../dialogs/measurement-unit-dialog';

@Component({
  selector: 'measurement-units-page',
  imports: [BreadcrumbsNg, Icon, MeasurementUnitsSearch, MeasurementUnitsTable, PaginationNg],
  templateUrl: './measurement-units.page.html',
})
export default class MeasurementUnitsPage {
  private readonly dialog = inject(Dialog);
  private readonly measurementUnitsService = inject(MeasurementUnitsService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizes = [10, 25, 50];
  protected readonly measurementUnits = signal<PaginatedResult<MeasurementUnit> | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly listError = signal<string | null>(null);

  private readonly search$ = new Subject<string>();
  protected readonly search = toSignal(this.search$.pipe(startWith(''), debounceTime(300)), {
    initialValue: '',
  });
  private requestId = 0;

  private readonly filter$ = combineLatest({
    page: toObservable(this.page),
    pageSize: toObservable(this.pageSize),
    search: toObservable(this.search),
  }).pipe(
    debounceTime(100),
    switchMap(({ page, pageSize, search }) => {
      const trimmed = search.trim();
      const currentRequestId = ++this.requestId;
      this.isLoading.set(true);
      this.listError.set(null);
      return this.measurementUnitsService
        .findAll({
          page,
          limit: pageSize,
          ...(trimmed ? { search: trimmed } : {}),
        })
        .pipe(
          catchError((error: unknown) => {
            this.listError.set(this.getErrorMessage(error));
            return EMPTY;
          }),
          finalize(() => {
            if (currentRequestId === this.requestId) {
              this.isLoading.set(false);
            }
          }),
        );
    }),
  );

  protected readonly total = computed(() => this.measurementUnits()?.total ?? 0);
  protected readonly lastPage = computed(() => this.measurementUnits()?.lastPage ?? 0);

  constructor() {
    this.filter$
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.measurementUnits.set(result));
  }

  protected onSearch(search: string): void {
    this.search$.next(search);
    this.page.set(1);
  }

  protected onCreate(): void {
    const dialogRef = openMeasurementUnitDialog(this.dialog);
    dialogRef.closed.subscribe((measurementUnit) => {
      if (!measurementUnit) {
        return;
      }
      this.measurementUnits.update((result) =>
        result
          ? {
              ...result,
              data: [measurementUnit, ...result.data],
              total: result.total + 1,
            }
          : result,
      );
      toast.success('Unidad de medida creada correctamente');
    });
  }

  protected onEdit(measurementUnit: MeasurementUnit): void {
    const dialogRef = openMeasurementUnitDialog(this.dialog, measurementUnit);
    dialogRef.closed.subscribe((updated) => {
      if (!updated) {
        return;
      }
      this.measurementUnits.update((result) =>
        result
          ? {
              ...result,
              data: result.data.map((item) => (item.id === updated.id ? updated : item)),
            }
          : result,
      );
      toast.success('Unidad de medida actualizada correctamente');
    });
  }

  protected onDelete(measurementUnit: MeasurementUnit): void {
    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar unidad de medida',
      message: `¿Estás seguro de que deseas eliminar la unidad "${measurementUnit.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    dialogRef.closed.subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.measurementUnitsService.remove(measurementUnit.id).subscribe({
        next: () => this.removeFromCurrentPage(measurementUnit),
        error: (error) => toast.error(this.getErrorMessage(error)),
      });
    });
  }

  private removeFromCurrentPage(measurementUnit: MeasurementUnit): void {
    const result = this.measurementUnits();
    const isLastRowOnLaterPage = this.page() > 1 && result?.data.length === 1;

    this.measurementUnits.update((current) =>
      current
        ? {
            ...current,
            data: current.data.filter((item) => item.id !== measurementUnit.id),
            total: Math.max(0, current.total - 1),
          }
        : current,
    );

    if (isLastRowOnLaterPage) {
      this.page.update((currentPage) => Math.max(1, currentPage - 1));
    }
    toast.success('Unidad de medida eliminada correctamente');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string | string[] } | null;
      if (Array.isArray(body?.message)) {
        return body.message.join(', ');
      }
      if (body?.message) {
        return body.message;
      }
      return error.message;
    }
    return 'Error inesperado';
  }
}
