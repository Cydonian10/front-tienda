import { HttpErrorResponse, httpResource } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, startWith, Subject } from 'rxjs';

import BreadcrumbsNg from '../../../shared/breadcrumbs/breadcrumbs.ng';
import { Icon } from '../../../shared/icon/icon';
import { environment } from '../../../../environments/environment';
import { Brand } from '../../../core/models/brand.model';
import { PaginatedResult } from '../../../core/models/pagination.model';

@Component({
  selector: 'marcas-page',
  imports: [BreadcrumbsNg, Icon],
  templateUrl: './marcas.page.html',
})
export default class MarcasPage {
  private readonly PAGE_SIZE = 10;

  protected readonly page = signal(1);

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
          limit: this.PAGE_SIZE,
          ...(search ? { search } : {}),
        },
      };
    },
    {
      defaultValue: {
        data: [],
        total: 0,
        page: 1,
        limit: this.PAGE_SIZE,
        lastPage: 0,
      },
      parse: (raw) => raw as PaginatedResult<Brand>,
    },
  );

  protected onSearch(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
    this.page.set(1);
  }

  protected previousPage(): void {
    this.page.set(Math.max(1, this.page() - 1));
  }

  protected nextPage(): void {
    this.page.set(Math.min(this.brands.value()?.lastPage ?? 1, this.page() + 1));
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
