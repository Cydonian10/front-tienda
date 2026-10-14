import { Component, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';

interface DemoVariant {
  sku: string;
  color: string;
  size: string;
  price: string;
  barcode: string;
}

const DEMO_VARIANTS: readonly DemoVariant[] = [
  { sku: 'CAM-NEG-M', color: 'Negro', size: 'M', price: '39.90', barcode: '7751234500012' },
  { sku: 'CAM-NEG-L', color: 'Negro', size: 'L', price: '39.90', barcode: '7751234500029' },
  { sku: 'CAM-BLA-M', color: 'Blanco', size: 'M', price: '39.90', barcode: '7751234500036' },
];

@Component({
  imports: [Icon],
  selector: 'producto-prueba',
  templateUrl: './producto-prueba-page.html',
  host: { class: 'block min-w-0' },
})
export default class ProductoPruebaPage {
  readonly mode = signal<'create' | 'manage'>('create');
  readonly step = signal(0);
  readonly steps = [
    { title: 'Datos generales', detail: 'Lo esencial del producto' },
    { title: 'Variantes', detail: 'SKU, precio y atributos' },
    { title: 'Unidades', detail: 'Conversiones por producto' },
    { title: 'Revisar', detail: 'Confirma los detalles' },
  ] as const;
  readonly variants = DEMO_VARIANTS;
  readonly attributes = ['Color', 'Talla', 'Capacidad', 'Material', 'Presentación'] as const;

  showCreate(): void {
    this.mode.set('create');
    this.step.set(0);
  }

  showManage(): void {
    this.mode.set('manage');
  }

  goToStep(step: number): void {
    if (step >= 0 && step < this.steps.length) this.step.set(step);
  }
}
