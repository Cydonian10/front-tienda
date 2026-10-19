import { Component, computed, inject, input, output } from '@angular/core';
import { QueryClient } from '@tanstack/angular-query-experimental';
import type {
  ProductoSeleccion,
  ProductosPagina,
} from '../../../../../api/interfaces/inventario/producto.interface';
import { productosBusquedaQueryKey, useProductosBusqueda } from '../../../../actions/use-productos-action';

const PAGE_SIZE = 20;

@Component({
  selector: 'producto-selector',
  templateUrl: './producto-selector.html',
  host: { class: 'block min-w-0' },
})
export class ProductoSelector {
  private readonly client = inject(QueryClient);
  readonly selectedId = input('');
  readonly selected = output<ProductoSeleccion>();
  readonly searchText = input('');
  readonly requestedPages = input(1);
  readonly searchChanged = output<string>();
  readonly moreRequested = output<void>();
  readonly pageQuery = useProductosBusqueda(this.searchText, this.requestedPages, () => PAGE_SIZE);
  readonly currentPage = computed(() => {
    this.pageQuery.data();
    return this.client.getQueryData<ProductosPagina>(
      productosBusquedaQueryKey(this.searchText().trim(), this.requestedPages(), PAGE_SIZE),
    );
  });
  readonly results = computed(() => {
    const current = this.currentPage();
    const term = this.searchText().trim();
    if (term.length < 2) return [];
    return Array.from({ length: this.requestedPages() }, (_, index) => {
      const page = index + 1;
      return page === this.requestedPages()
        ? current
        : this.client.getQueryData<ProductosPagina>(productosBusquedaQueryKey(term, page, PAGE_SIZE));
    }).flatMap((page) => page?.items ?? []);
  });
  readonly ready = computed(() => this.searchText().trim().length >= 2);
  readonly loading = computed(() => this.pageQuery.isPending());
  readonly error = computed(() => this.pageQuery.isError());
  readonly hasMore = computed(() => {
    const lastPage = this.currentPage();
    return !!lastPage && this.results().length < lastPage.totalItems;
  });

  onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  loadMore(): void {
    if (this.hasMore() && !this.loading() && !this.error()) {
      this.moreRequested.emit();
    }
  }

  retry(): void {
    if (this.error()) void this.pageQuery.refetch();
  }
}
