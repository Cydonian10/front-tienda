import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { debounceTime, startWith, Subject } from 'rxjs';
import { toast } from 'ngx-sonner';

import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { Icon } from '../../../../shared/icon/icon';
import { openConfirmDialog } from '../../../../shared/confirm-dialog/confirm-dialog';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../../core/models/product.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import { ProductsService } from '../../../../core/api/products.service';

@Component({
  selector: 'products-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon],
  templateUrl: './products.page.html',
})
export default class ProductsPage {
  private readonly dialog = inject(Dialog);
  private readonly productsService = inject(ProductsService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  private readonly search$ = new Subject<string>();
  protected readonly search = toSignal(this.search$.pipe(startWith(''), debounceTime(300)), {
    initialValue: '',
  });

  private readonly minPrice$ = new Subject<number | null>();
  protected readonly minPrice = toSignal(
    this.minPrice$.pipe(startWith<number | null>(null), debounceTime(300)),
    { initialValue: null },
  );

  private readonly maxPrice$ = new Subject<number | null>();
  protected readonly maxPrice = toSignal(
    this.maxPrice$.pipe(startWith<number | null>(null), debounceTime(300)),
    { initialValue: null },
  );

  private readonly minStock$ = new Subject<number | null>();
  protected readonly minStock = toSignal(
    this.minStock$.pipe(startWith<number | null>(null), debounceTime(300)),
    { initialValue: null },
  );

  protected readonly products = httpResource<PaginatedResult<Product>>(
    () => {
      const search = this.search().trim();
      const minPrice = this.minPrice();
      const maxPrice = this.maxPrice();
      const minStock = this.minStock();
      return {
        url: `${environment.apiUrl}/products`,
        params: {
          page: this.page(),
          limit: this.pageSize(),
          ...(search ? { search } : {}),
          ...(minPrice !== null ? { minPrice } : {}),
          ...(maxPrice !== null ? { maxPrice } : {}),
          ...(minStock !== null ? { minStock } : {}),
        },
      };
    },
    {
      parse: (raw) => raw as PaginatedResult<Product>,
    },
  );

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected onMinPrice(event: Event): void {
    this.minPrice$.next(this.parseNumber((event.target as HTMLInputElement).value));
    this.page.set(1);
  }

  protected onMaxPrice(event: Event): void {
    this.maxPrice$.next(this.parseNumber((event.target as HTMLInputElement).value));
    this.page.set(1);
  }

  protected onMinStock(event: Event): void {
    this.minStock$.next(this.parseNumber((event.target as HTMLInputElement).value));
    this.page.set(1);
  }

  protected attributesLabel(product: Product): string {
    if (product.productAttributes.length === 0) {
      return '—';
    }
    return product.productAttributes
      .map((attr) => `${attr.attributeName}: ${attr.attributeValue}`)
      .join(', ');
  }

  protected async onDelete(product: Product): Promise<void> {
    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    const confirmed = await firstValueFrom(dialogRef.closed);
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.productsService.remove(product.id));
      this.products.update((result) =>
        result
          ? {
              ...result,
              data: result.data.filter((item) => item.id !== product.id),
              total: Math.max(0, result.total - 1),
            }
          : result,
      );
      toast.success('Producto eliminado correctamente');
    } catch (err) {
      toast.error(this.getErrorMessage(err));
    }
  }

  protected readonly errorMessage = computed<string | null>(() => {
    const error = this.products.error();
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
    return error ? 'Error al cargar los productos' : null;
  });

  private parseNumber(value: string): number | null {
    const parsed = Number(value);
    return value === '' || Number.isNaN(parsed) ? null : parsed;
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
