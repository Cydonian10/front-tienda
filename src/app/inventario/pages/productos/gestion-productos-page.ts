import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, HostListener, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { useProductoApi, useProductoDetalle } from '../../actions/use-productos-action';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { ProductoSeleccion, UpdateProductDto } from '../../../api/interfaces/inventario/producto.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { DatosGeneralesStep } from './components/datos-generales-step/datos-generales-step';
import { ProductoSelector } from './components/producto-selector/producto-selector';
import { PendingProductChanges } from './guards/pending-product-changes.guard';

const PRODUCT_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

@Component({
  selector: 'gestion-productos-page',
  imports: [RouterLink, ProductoSelector, DatosGeneralesStep],
  templateUrl: './gestion-productos-page.html',
  host: { class: 'block min-w-0' },
})
export default class GestionProductosPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmation = inject(ConfirmDialogService);
  private readonly pendingChanges = inject(PendingProductChanges);
  private readonly destroyRef = inject(DestroyRef);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly selectedId = computed(() => this.queryParams().get('productoId') ?? '');
  readonly searchText = signal('');
  readonly requestedPages = signal(1);
  readonly invalidId = computed(() => !!this.selectedId() && !PRODUCT_ID_PATTERN.test(this.selectedId()));
  private readonly validId = computed(() => (this.invalidId() ? '' : this.selectedId()));
  readonly productQuery = useProductoDetalle(this.validId);
  readonly permissions = usePermissions('INVENTARIO', { edit: PERMISSION_CODES.PRODUCTS_UPDATE });
  private readonly actions = useProductoApi();
  readonly updateMutation = this.actions.actualizarMutation;
  readonly savedVersion = signal(0);
  readonly generalData = viewChild(DatosGeneralesStep);
  readonly hasUnsavedChanges = computed(() => this.generalData()?.dirty() ?? false);
  readonly saveError = computed(() => {
    const error = this.updateMutation.error();
    if (error instanceof HttpErrorResponse) {
      const message: unknown = error.error?.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
        return message.join('. ');
      }
    }
    return 'No se pudieron guardar los cambios. Revisa los datos e inténtalo de nuevo.';
  });

  constructor() {
    this.destroyRef.onDestroy(this.pendingChanges.watch(
      () => this.hasUnsavedChanges(),
      () => this.updateMutation.isPending(),
    ));
    effect(() => {
      this.selectedId();
      untracked(() => this.updateMutation.reset());
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  confirmBrowserExit(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault();
  }

  async saveProduct(dto: UpdateProductDto): Promise<void> {
    const product = this.productQuery.data();
    if (!this.permissions.edit() || !product || this.updateMutation.isPending()) return;
    if (!product.puedeCambiarUnidadBase && dto.unidadBaseId !== product.unidadBaseId) return;
    try {
      await this.updateMutation.mutateAsync({ id: product.id, dto });
      this.savedVersion.update((version) => version + 1);
    } catch {
      // La mutación muestra el error y el formulario conserva los cambios.
    }
  }

  async discardEdit(): Promise<void> {
    if (!await firstValueFrom(this.pendingChanges.confirmLeave())) return;
    this.generalData()?.cancelEdit();
    this.updateMutation.reset();
  }

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
