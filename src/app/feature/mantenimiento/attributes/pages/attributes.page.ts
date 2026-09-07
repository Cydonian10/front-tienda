import { HttpErrorResponse } from '@angular/common/http';
import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
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

import { AttributesService } from '../../../../core/api/attributes.service';
import {
  AttributeBatchResult,
  AttributeWithValues,
} from '../../../../core/models/attribute.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../shared/icon/icon';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { AttributeSearch } from '../components/attribute-search/attribute-search.component';
import { AttributeTable } from '../components/attribute-table/attribute-table.component';
import { openAttributeValuesDialog } from '../dialogs/attribute-values-dialog/attribute-values-dialog';
import { openCreateAttributeDialog } from '../dialogs/create-attribute-dialog/create-attribute-dialog';
import { openEditAttributeDialog } from '../dialogs/edit-attribute-dialog/edit-attribute-dialog';

@Component({
  selector: 'attributes-page',
  imports: [AttributeSearch, AttributeTable, BreadcrumbsNg, Icon, PaginationNg],
  templateUrl: './attributes.page.html',
})
export default class AttributesPage {
  private readonly attributesService = inject(AttributesService);
  private readonly dialog = inject(Dialog);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly pageSizes = [10, 25, 50];
  protected readonly attributes = signal<PaginatedResult<AttributeWithValues> | null>(null);
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
      return this.attributesService
        .findAllWithValues({
          page,
          limit: pageSize,
          ...(trimmed ? { search: trimmed } : {}),
        })
        .pipe(
          catchError((error: unknown) => {
            const message = this.getErrorMessage(error);
            this.listError.set(message);
            toast.error(message);
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

  protected readonly total = computed(() => this.attributes()?.total ?? 0);
  protected readonly lastPage = computed(() => this.attributes()?.lastPage ?? 0);

  constructor() {
    this.filter$.pipe(takeUntilDestroyed()).subscribe((result) => this.attributes.set(result));
  }

  protected onSearch(search: string): void {
    this.search$.next(search);
    this.page.set(1);
  }

  protected onCreate(): void {
    const dialogRef = openCreateAttributeDialog(this.dialog);
    dialogRef.closed.subscribe((result) => {
      if (!result) {
        return;
      }
      this.updateAttributes(result);
      toast.success(
        result.created
          ? 'Atributo creado correctamente'
          : 'Valores agregados al atributo existente correctamente',
      );
    });
  }

  protected onShowValues(attribute: AttributeWithValues): void {
    openAttributeValuesDialog(this.dialog, attribute);
  }

  protected onEdit(attribute: AttributeWithValues): void {
    openEditAttributeDialog(this.dialog, attribute).closed.subscribe((updated) => {
      if (updated) {
        this.updateEditedAttribute(updated);
      }
    });
  }

  protected onDelete(attribute: AttributeWithValues): void {
    openConfirmDialog(this.dialog, {
      title: 'Eliminar atributo',
      message: `¿Estás seguro de que deseas eliminar el atributo "${attribute.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    }).closed.subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.attributesService.remove(attribute.id).subscribe({
        next: () => this.removeAttribute(attribute),
        error: (error) => toast.error(this.getErrorMessage(error)),
      });
    });
  }

  private updateAttributes(result: AttributeBatchResult): void {
    if (!this.matchesCurrentSearch(result.attribute)) {
      return;
    }

    this.attributes.update((current) => {
      if (!current) {
        return current;
      }
      if (!result.created) {
        return {
          ...current,
          data: current.data.map((item) =>
            item.id === result.attribute.id ? result.attribute : item,
          ),
        };
      }

      const total = current.total + 1;
      return {
        ...current,
        data: [result.attribute, ...current.data].slice(0, this.pageSize()),
        total,
        lastPage: Math.ceil(total / current.limit),
      };
    });
  }

  private updateEditedAttribute(attribute: AttributeWithValues): void {
    const current = this.attributes();
    const shouldRemove = !this.matchesCurrentSearch(attribute);
    const isLastRowOnLaterPage =
      shouldRemove && this.page() > 1 && current?.data.length === 1;

    this.attributes.update((result) => {
      if (!result) {
        return result;
      }
      if (!shouldRemove) {
        return {
          ...result,
          data: result.data.map((item) => (item.id === attribute.id ? attribute : item)),
        };
      }

      const total = Math.max(0, result.total - 1);
      return {
        ...result,
        data: result.data.filter((item) => item.id !== attribute.id),
        total,
        lastPage: Math.ceil(total / result.limit),
      };
    });

    if (isLastRowOnLaterPage) {
      this.page.update((currentPage) => Math.max(1, currentPage - 1));
    }
  }

  private removeAttribute(attribute: AttributeWithValues): void {
    const current = this.attributes();
    const isLastRowOnLaterPage = this.page() > 1 && current?.data.length === 1;

    this.attributes.update((result) => {
      if (!result) {
        return result;
      }
      const total = Math.max(0, result.total - 1);
      return {
        ...result,
        data: result.data.filter((item) => item.id !== attribute.id),
        total,
        lastPage: Math.ceil(total / result.limit),
      };
    });

    if (isLastRowOnLaterPage) {
      this.page.update((currentPage) => Math.max(1, currentPage - 1));
    }
    toast.success('Atributo eliminado correctamente');
  }

  private matchesCurrentSearch(attribute: AttributeWithValues): boolean {
    const search = this.normalize(this.search());
    return !search || this.normalize(attribute.name).includes(search);
  }

  private normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
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
