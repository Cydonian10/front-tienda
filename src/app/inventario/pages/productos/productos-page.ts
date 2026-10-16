import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatosGeneralesStep } from './components/datos-generales-step/datos-generales-step';
import { ProductosHeader } from './components/productos-header/productos-header';
import { ProductosStepNavigation } from './components/productos-step-navigation/productos-step-navigation';
import type { ProductMode, ProductStep } from './components/productos-types';
import { RevisionStep } from './components/revision-step/revision-step';
import { UnidadesStep } from './components/unidades-step/unidades-step';
import { VariantesStep } from './components/variantes-step/variantes-step';
import { useProductoApi } from '../../actions/use-productos-action';
import { ProductoApi } from '../../../api/inventario/product-api';
import type {
  ProductResponse,
  CreateProductDto,
  UpdateProductDto,
} from '../../../api/interfaces/inventario/producto.interface';

@Component({
  imports: [
    ProductosHeader,
    ProductosStepNavigation,
    DatosGeneralesStep,
    VariantesStep,
    UnidadesStep,
    RevisionStep,
  ],
  selector: 'productos',
  templateUrl: './productos-page.html',
  host: { class: 'mx-auto w-full max-w-6xl pb-10' },
})
export default class ProductosPage {
  private readonly api = inject(ProductoApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly mode = signal<ProductMode>('create');
  readonly step = signal(0);
  readonly product = signal<ProductResponse | null>(null);
  readonly loadingProduct = signal(false);
  readonly loadError = signal(false);
  readonly editingProduct = signal(false);
  private loadVersion = 0;
  private readonly actions = useProductoApi();
  readonly createMutation = this.actions.crearMutation;
  readonly updateMutation = this.actions.actualizarMutation;
  readonly steps: readonly ProductStep[] = [
    { title: 'Datos generales', detail: 'Lo esencial del producto' },
    { title: 'Variantes', detail: 'SKU, precio y atributos' },
    { title: 'Unidades', detail: 'Conversiones por producto' },
    { title: 'Revisar', detail: 'Confirma los detalles' },
  ];

  constructor() {
    const id = this.route.snapshot.queryParamMap.get('productoId');
    if (id) void this.loadProduct(id);
  }

  async loadProduct(id: string): Promise<void> {
    const version = ++this.loadVersion;
    this.loadingProduct.set(true);
    this.loadError.set(false);
    try {
      const product = await this.api.getById(id);
      if (version === this.loadVersion) this.product.set(product);
    } catch {
      if (version === this.loadVersion) this.loadError.set(true);
    } finally {
      if (version === this.loadVersion) this.loadingProduct.set(false);
    }
  }

  retryLoad(): void {
    const id = this.route.snapshot.queryParamMap.get('productoId');
    if (id) void this.loadProduct(id);
  }

  showCreate(): void {
    if (this.createMutation.isPending() || this.updateMutation.isPending()) return;
    this.loadVersion++;
    this.loadingProduct.set(false);
    this.mode.set('create');
    this.step.set(0);
    this.editingProduct.set(false);
    this.product.set(null);
    this.loadError.set(false);
    this.createMutation.reset();
    this.updateMutation.reset();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { productoId: null },
      queryParamsHandling: 'merge',
    });
  }

  showManage(): void {
    this.mode.set('manage');
  }

  goToStep(step: number): void {
    if (
      !this.loadingProduct() &&
      !this.loadError() &&
      !this.editingProduct() &&
      !this.createMutation.isPending() &&
      !this.updateMutation.isPending() &&
      step >= 0 &&
      step < this.steps.length &&
      (step === 0 || this.product())
    ) {
      this.step.set(step);
    }
  }

  async createProduct(dto: CreateProductDto): Promise<void> {
    if (this.createMutation.isPending() || this.product()) return;
    try {
      const product = await this.createMutation.mutateAsync(dto);
      this.product.set(product);
      this.step.set(1);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { productoId: product.id },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } catch {
      // El error de la mutación se muestra en la plantilla y permite reintentar.
    }
  }

  async updateProduct(dto: UpdateProductDto): Promise<void> {
    const id = this.product()?.id;
    if (!id || this.updateMutation.isPending()) return;
    try {
      this.product.set(await this.updateMutation.mutateAsync({ id, dto }));
    } catch {
      // El error se muestra en el paso y los datos del formulario permanecen editables.
    }
  }
}
