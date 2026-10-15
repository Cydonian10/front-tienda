import { Component, signal } from '@angular/core';
import { DatosGeneralesStep } from './components/datos-generales-step/datos-generales-step';
import { ProductosHeader } from './components/productos-header/productos-header';
import { ProductosStepNavigation } from './components/productos-step-navigation/productos-step-navigation';
import type { ProductMode, ProductStep, ProductVariant } from './components/productos-types';
import { RevisionStep } from './components/revision-step/revision-step';
import { UnidadesStep } from './components/unidades-step/unidades-step';
import { VariantesStep } from './components/variantes-step/variantes-step';
import { useProductoApi } from '../../actions/use-productos-action';
import type { CreateProductDto } from '../../../api/inventario/product-api';

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
  readonly mode = signal<ProductMode>('create');
  readonly step = signal(0);
  readonly createdProductId = signal<string | null>(null);
  readonly createMutation = useProductoApi().crearMutation;
  readonly steps: readonly ProductStep[] = [
    { title: 'Datos generales', detail: 'Lo esencial del producto' },
    { title: 'Variantes', detail: 'SKU, precio y atributos' },
    { title: 'Unidades', detail: 'Conversiones por producto' },
    { title: 'Revisar', detail: 'Confirma los detalles' },
  ];
  readonly variants: readonly ProductVariant[] = [
    { sku: 'CAM-NEG-M', color: 'Negro', size: 'M', price: '39.90', barcode: '7751234500012' },
    { sku: 'CAM-NEG-L', color: 'Negro', size: 'L', price: '39.90', barcode: '7751234500029' },
    { sku: 'CAM-BLA-M', color: 'Blanco', size: 'M', price: '39.90', barcode: '7751234500036' },
  ];
  readonly attributes = ['Color', 'Talla', 'Capacidad', 'Material', 'Presentación'] as const;

  showCreate(): void {
    if (this.createMutation.isPending()) return;
    this.mode.set('create');
    this.step.set(0);
    this.createdProductId.set(null);
    this.createMutation.reset();
  }

  showManage(): void {
    this.mode.set('manage');
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.steps.length && (step === 0 || this.createdProductId())) {
      this.step.set(step);
    }
  }

  async createProduct(dto: CreateProductDto): Promise<void> {
    if (this.createMutation.isPending() || this.createdProductId()) return;
    try {
      const product = await this.createMutation.mutateAsync(dto);
      this.createdProductId.set(product.id);
    } catch {
      // El error de la mutación se muestra en la plantilla y permite reintentar.
    }
  }
}
