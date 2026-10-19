import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { useProductoDetalle } from '../../actions/use-productos-action';
import type { ProductoSeleccion } from '../../../api/interfaces/inventario/producto.interface';
import { ProductoSelector } from './components/producto-selector/producto-selector';

const PRODUCT_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

@Component({
  selector: 'gestion-productos-page',
  imports: [RouterLink, ProductoSelector],
  templateUrl: './gestion-productos-page.html',
  host: { class: 'block min-w-0' },
})
export default class GestionProductosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly selectedId = computed(() => this.queryParams().get('productoId') ?? '');
  readonly searchText = signal('');
  readonly requestedPages = signal(1);
  readonly invalidId = computed(() => !!this.selectedId() && !PRODUCT_ID_PATTERN.test(this.selectedId()));
  private readonly validId = computed(() => (this.invalidId() ? '' : this.selectedId()));
  readonly productQuery = useProductoDetalle(this.validId);

  search(term: string): void {
    this.searchText.set(term);
    this.requestedPages.set(1);
  }

  selectProduct(product: ProductoSeleccion): void {
    if (product.id === this.selectedId()) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { productoId: product.id },
      queryParamsHandling: 'merge',
    });
  }

  clearProduct(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { productoId: null },
      queryParamsHandling: 'merge',
    });
  }
}
