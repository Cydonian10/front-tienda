import { Component, input, output, signal } from '@angular/core';

import { PaginatedResult } from '../../../../../core/models/pagination.model';
import { Product, ProductUnit } from '../../../../../core/models/product.model';

@Component({
  selector: 'sales-product-picker',
  templateUrl: './sales-product-picker.html',
})
export class SalesProductPicker {
  readonly result = input<PaginatedResult<Product> | null>(null);
  readonly isLoading = input(false);
  readonly page = input.required<number>();
  readonly searchChanged = output<string>();
  readonly pageChanged = output<number>();
  readonly productAdded = output<{ product: Product; unit: ProductUnit }>();
  private readonly selectedUnitIds = signal<Record<number, number>>({});

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  protected previousPage(): void {
    this.pageChanged.emit(Math.max(1, this.page() - 1));
  }

  protected nextPage(): void {
    const lastPage = this.result()?.lastPage ?? 0;
    if (this.page() < lastPage) this.pageChanged.emit(this.page() + 1);
  }

  protected onUnitChanged(product: Product, event: Event): void {
    const unitId = Number((event.target as HTMLSelectElement).value);
    if (!product.units.some((unit) => unit.unitId === unitId)) return;
    this.selectedUnitIds.update((units) => ({ ...units, [product.id]: unitId }));
  }

  protected addProduct(product: Product): void {
    const unit = this.unitFor(product);
    if (unit) this.productAdded.emit({ product, unit });
  }

  protected unitFor(product: Product): ProductUnit | null {
    const selectedUnitId = this.selectedUnitIds()[product.id];
    return (
      product.units.find((unit) => unit.unitId === selectedUnitId) ??
      product.units.find((unit) => unit.isMain) ??
      product.units[0] ??
      null
    );
  }

  protected mainUnit(product: Product): ProductUnit | null {
    return product.units.find((unit) => unit.isMain) ?? null;
  }

  protected presentationPrice(product: Product): number {
    return this.round2(product.price * (this.unitFor(product)?.factor ?? 1));
  }

  protected availableInUnit(product: Product): number {
    const factor = this.unitFor(product)?.factor ?? 1;
    return product.stock / factor;
  }

  protected formatQuantity(value: number, decimals = 2): string {
    return Number(value.toFixed(decimals)).toString();
  }

  protected productLabel(product: Product): string {
    const attributes = product.productAttributes
      .map((attribute) => `${attribute.attributeName}: ${attribute.attributeValue}`)
      .join(', ');
    return attributes ? `${product.baseProductName} · ${attributes}` : product.baseProductName;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
