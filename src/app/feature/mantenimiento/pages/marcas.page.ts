import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Dialog } from '@angular/cdk/dialog';
import { debounceTime, startWith, Subject } from 'rxjs';

import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../shared/pagination/pagination.ng';
import { Icon } from '../../../shared/icon/icon';
import { environment } from '../../../../environments/environment';
import { Brand } from '../../../core/models/brand.model';
import { PaginatedResult } from '../../../core/models/pagination.model';
import { openBrandDialog } from './dialogs/brand-dialog';

@Component({
  selector: 'marcas-page',
  imports: [BreadcrumbsNg, PaginationNg, Icon],
  templateUrl: './marcas.page.html',
})
export default class MarcasPage {
  private readonly dialog = inject(Dialog);

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
        this.brands.reload();
      }
    });
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
}
