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
import { Brand } from '../../../../core/models/brand.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import { BrandsService } from '../../../../core/api/brands.service';
import { openBrandDialog } from './dialogs/brand-dialog';

@Component({
  selector: 'marcas-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon],
  templateUrl: './marcas.page.html',
})
export default class MarcasPage {
  private readonly dialog = inject(Dialog);
  private readonly brandsService = inject(BrandsService);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  private readonly search$ = new Subject<string>();
  protected readonly search = toSignal(this.search$.pipe(startWith(''), debounceTime(300)), {
    initialValue: '',
  });

  protected readonly brands = httpResource<PaginatedResult<Brand>>(
    () => {
      const search = this.search().trim();
      return {
        url: `${environment.apiUrl}/brands`,
        params: {
          page: this.page(),
          limit: this.pageSize(),
          ...(search ? { search } : {}),
        },
      };
    },
    {
      parse: (raw) => raw as PaginatedResult<Brand>,
    },
  );

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected openCreateDialog(): void {
    const dialogRef = openBrandDialog(this.dialog);
    dialogRef.closed.subscribe((brand) => {
      if (brand) {
        this.brands.update((result) =>
          result ? { ...result, data: [...result.data, brand], total: result.total + 1 } : result,
        );
        toast.success('Marca creada correctamente');
      }
    });
  }

  protected openEditDialog(brand: Brand): void {
    const dialogRef = openBrandDialog(this.dialog, brand);
    dialogRef.closed.subscribe((updated) => {
      if (updated) {
        this.brands.update((result) =>
          result
            ? {
                ...result,
                data: result.data.map((item) => (item.id === updated.id ? updated : item)),
              }
            : result,
        );
        toast.success('Marca actualizada correctamente');
      }
    });
  }

  protected async onDelete(brand: Brand): Promise<void> {
    const dialogRef = openConfirmDialog(this.dialog, {
      title: 'Eliminar marca',
      message: `¿Estás seguro de que deseas eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    const confirmed = await firstValueFrom(dialogRef.closed);
    if (!confirmed) {
      return;
    }
    try {
      await firstValueFrom(this.brandsService.remove(brand.id));
      this.brands.update((result) =>
        result
          ? {
              ...result,
              data: result.data.filter((item) => item.id !== brand.id),
              total: Math.max(0, result.total - 1),
            }
          : result,
      );
      toast.success('Marca eliminada correctamente');
    } catch (err) {
      toast.error(this.getErrorMessage(err));
    }
  }

  protected readonly errorMessage = computed<string | null>(() => {
    const error = this.brands.error();
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
    return error ? 'Error al cargar las marcas' : null;
  });

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
