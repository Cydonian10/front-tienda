import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, ElementRef, HostListener, inject, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { useProductoApi, useProductoDetalle } from '../../actions/use-productos-action';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { ProductoSeleccion, UpdateProductDto } from '../../../api/interfaces/inventario/producto.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import type { CreateVarianteDto } from '../../../api/interfaces/inventario/variante.interface';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog/confirm-dialog.service';
import { useProductoAtributosApi } from '../../actions/use-producto-atributos-action';
import { useVarianteApi } from '../../actions/use-variante-action';
import { DatosGeneralesStep } from './components/datos-generales-step/datos-generales-step';
import { ProductoSelector } from './components/producto-selector/producto-selector';
import { VarianteCard } from './components/variante-card/variante-card';
import { VarianteForm } from './components/variantes-step/variante-form';
import { PendingProductChanges } from './guards/pending-product-changes.guard';

const PRODUCT_ID_PATTERN = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

@Component({
  selector: 'gestion-productos-page',
  imports: [RouterLink, ProductoSelector, DatosGeneralesStep, VarianteCard, VarianteForm],
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
  private readonly variantActions = useVarianteApi(this.validId);
  readonly variantsQuery = this.variantActions.variantsQuery;
  readonly createMutation = this.variantActions.createMutation;
  private readonly attributeActions = useProductoAtributosApi(this.validId);
  readonly attributesQuery = this.attributeActions.attributesQuery;
  readonly selectedAttributes = computed(() =>
    this.attributesQuery.data()?.filter((attribute) => !!attribute.productoId) ?? [],
  );
  readonly newVariantOpen = signal(false);
  private readonly addVariantButton = viewChild<ElementRef<HTMLButtonElement>>('addVariantButton');
  readonly variantCards = viewChildren(VarianteCard);
  readonly variantForm = viewChild(VarianteForm);
  private restoreVariantFocus = false;
  readonly hasUnsavedChanges = computed(() =>
    !!this.generalData()?.dirty() || (this.newVariantOpen() && !!this.variantForm()?.dirty()) ||
    this.variantCards().some((card) => card.dirty()),
  );
  readonly isSaving = computed(() =>
    this.updateMutation.isPending() || this.createMutation.isPending() ||
    this.variantCards().some((card) => card.updateMutation.isPending()),
  );
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
      () => this.isSaving(),
    ));
    effect(() => {
      this.selectedId();
      untracked(() => {
        this.updateMutation.reset();
        this.createMutation.reset();
        this.newVariantOpen.set(false);
      });
    });
    effect(() => {
      const open = this.newVariantOpen();
      const form = this.variantForm();
      const trigger = this.addVariantButton();
      untracked(() => {
        if (open) {
          this.restoreVariantFocus = true;
          form?.focusFirstField();
        } else if (this.restoreVariantFocus && trigger) {
          trigger.nativeElement.focus();
          this.restoreVariantFocus = false;
        }
      });
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
    if (this.isSaving()) return;
    if (this.generalData()?.dirty() && !await firstValueFrom(this.confirmation.confirm({
      title: 'Descartar datos generales',
      message: '¿Quieres descartar los cambios sin guardar de los datos generales?',
      confirmText: 'Descartar cambios',
      cancelText: 'Seguir editando',
      tone: 'danger',
    }))) return;
    this.generalData()?.cancelEdit();
    this.updateMutation.reset();
  }

  openNewVariant(): void {
    if (this.permissions.edit() && this.productQuery.data() && this.selectedAttributes().length &&
        !this.createMutation.isPending()) {
      this.newVariantOpen.set(true);
    }
  }

  async cancelNewVariant(): Promise<void> {
    if (this.createMutation.isPending()) return;
    if (this.variantForm()?.dirty() && !await firstValueFrom(this.confirmation.confirm({
      title: 'Descartar nueva variante',
      message: '¿Quieres descartar los datos sin guardar de esta nueva variante?',
      confirmText: 'Descartar variante',
      cancelText: 'Seguir editando',
      tone: 'danger',
    }))) return;
    this.newVariantOpen.set(false);
    this.createMutation.reset();
  }

  async createVariant(dto: CreateVarianteDto): Promise<void> {
    const product = this.productQuery.data();
    if (!this.permissions.edit() || !this.newVariantOpen() || !product ||
        !this.selectedAttributes().length || this.createMutation.isPending()) return;
    try {
      await this.createMutation.mutateAsync({ id: product.id, dto });
      this.newVariantOpen.set(false);
    } catch {
      // El formulario y las fotos pendientes permanecen disponibles para reintentar.
    }
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
