import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { debounceTime, startWith, Subject, switchMap } from 'rxjs';
import { combineLatest } from 'rxjs';
import { toast } from 'ngx-sonner';
import { BaseProductsService } from '../../../../core/api/base-products.service';
import { BaseProduct } from '../../../../core/models/base-product.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { openConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';
import { Icon } from '../../../../shared/icon/icon';
import PaginationNg from '../../../../shared/pagination/pagination.ng';

@Component({
  selector: 'base-products-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon, RouterLink],
  templateUrl: './base-products.page.html',
})
export default class BaseProductsPage {
  private readonly dialog = inject(Dialog);
  private readonly baseProductsService = inject(BaseProductsService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  private readonly search$ = new Subject<string>();
  protected readonly search = toSignal(this.search$.pipe(startWith(''), debounceTime(300)), {
    initialValue: '',
  });

  private readonly filter$ = combineLatest({
    page: toObservable(this.page),
    pageSize: toObservable(this.pageSize),
    search: toObservable(this.search),
  }).pipe(
    debounceTime(100),
    switchMap(({ page, pageSize, search }) => {
      const trimmed = search.trim();
      return this.baseProductsService.findAll({
        page,
        limit: pageSize,
        ...(trimmed ? { search: trimmed } : {}),
      });
    }),
  );

  protected readonly baseProducts = signal<PaginatedResult<BaseProduct> | null>(null);

  protected readonly total = computed(() => this.baseProducts()?.total ?? 0);
  protected readonly lastPage = computed(() => this.baseProducts()?.lastPage ?? 0);

  constructor() {
    this.filter$.subscribe((result) => this.baseProducts.set(result));
  }

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onDelete(baseProduct: BaseProduct): void {
    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar producto base',
      message: `¿Estás seguro de que deseas eliminar el producto base "${baseProduct.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    dialogRef.closed.subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.baseProductsService.remove(baseProduct.id).subscribe({
        next: () => {
          this.baseProducts.update((result) =>
            result
              ? {
                  ...result,
                  data: result.data.filter((item) => item.id !== baseProduct.id),
                  total: Math.max(0, result.total - 1),
                }
              : result,
          );
          toast.success('Producto base eliminado correctamente');
        },
        error: (err) => toast.error(this.getErrorMessage(err)),
      });
    });
  }

  protected categoriesLabel(baseProduct: BaseProduct): string {
    if (baseProduct.categories.length === 0) {
      return '—';
    }
    return baseProduct.categories.map((category) => category.name).join(', ');
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
