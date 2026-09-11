import { Component, input, output } from '@angular/core';

import { PaginatedResult } from '../../../../../core/models/pagination.model';
import { Person } from '../../../../../core/models/people.model';
import { SaleCartLine } from '../../../../../core/models/sale.model';

@Component({
  selector: 'sale-cart',
  templateUrl: './sale-cart.html',
})
export class SaleCart {
  readonly lines = input.required<SaleCartLine[]>();
  readonly customers = input<PaginatedResult<Person> | null>(null);
  readonly customerPage = input.required<number>();
  readonly customerId = input<number | null>(null);
  readonly discount = input(0);
  readonly subtotal = input(0);
  readonly total = input(0);
  readonly isSaving = input(false);
  readonly isEditing = input(false);
  readonly canSubmit = input(false);
  readonly customerChanged = output<number | null>();
  readonly customerPageChanged = output<number>();
  readonly quantityChanged = output<{ productId: number; quantity: number }>();
  readonly lineRemoved = output<number>();
  readonly discountChanged = output<number>();
  readonly saveRequested = output<void>();
  readonly payRequested = output<void>();

  protected customerLabel(customer: Person): string {
    return `${customer.firstName} ${customer.lastName} · ${customer.dni}`;
  }

  protected onCustomer(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.customerChanged.emit(Number.isInteger(value) && value > 0 ? value : null);
  }

  protected onQuantity(productId: number, event: Event): void {
    this.quantityChanged.emit({
      productId,
      quantity: Number((event.target as HTMLInputElement).value),
    });
  }

  protected onDiscount(event: Event): void {
    this.discountChanged.emit(Number((event.target as HTMLInputElement).value));
  }

  protected previousCustomerPage(): void {
    this.customerPageChanged.emit(Math.max(1, this.customerPage() - 1));
  }

  protected nextCustomerPage(): void {
    const lastPage = this.customers()?.lastPage ?? 0;
    if (this.customerPage() < lastPage) this.customerPageChanged.emit(this.customerPage() + 1);
  }
}
