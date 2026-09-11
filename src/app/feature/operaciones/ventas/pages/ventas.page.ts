import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PaymentMethodsService } from '../../../../core/api/payment-methods.service';
import { PeopleService } from '../../../../core/api/people.service';
import { ProductsService } from '../../../../core/api/products.service';
import {
  CashRegister,
  CashRegisterOpeningSummary,
} from '../../../../core/models/cash-register.model';
import { PaymentMethod } from '../../../../core/models/payment-method.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import { Person } from '../../../../core/models/people.model';
import { Product } from '../../../../core/models/product.model';
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';

@Component({
  selector: 'ventas-page',
  imports: [BreadcrumbsNg, RouterLink],
  templateUrl: './ventas.page.html',
})
export default class VentasPage {
  private readonly cashRegistersService = inject(CashRegistersService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly peopleService = inject(PeopleService);
  private readonly productsService = inject(ProductsService);
  private readonly authStore = inject(AuthStore);

  protected readonly registers = signal<CashRegister[]>([]);
  protected readonly products = signal<PaginatedResult<Product> | null>(null);
  protected readonly customers = signal<PaginatedResult<Person> | null>(null);
  protected readonly paymentMethods = signal<PaymentMethod[]>([]);
  protected readonly selectedOpeningId = signal<number | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly ownRegisters = computed(() => {
    const personId = this.authStore.person()?.id;
    if (!personId) return [];
    return this.registers().filter((register) => register.openOpening?.responsible.id === personId);
  });
  protected readonly selectedOpening = computed<CashRegisterOpeningSummary | null>(() => {
    const selected = this.ownRegisters().find(
      (register) => register.openOpening?.id === this.selectedOpeningId(),
    );
    return selected?.openOpening ?? null;
  });

  constructor() {
    void this.loadInitialData();
  }

  protected async reload(): Promise<void> {
    await this.loadInitialData();
  }

  protected selectOpening(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.selectedOpeningId.set(Number.isInteger(value) && value > 0 ? value : null);
  }

  private async loadInitialData(): Promise<void> {
    if (!this.authStore.person()) {
      this.isLoading.set(false);
      this.error.set('No se pudo identificar la persona de la sesión');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [registers, products, customers, paymentMethods] = await Promise.all([
        firstValueFrom(this.cashRegistersService.findAll()),
        firstValueFrom(this.productsService.findAll({ page: 1, limit: 20 })),
        firstValueFrom(this.peopleService.findAll({ page: 1, limit: 20 })),
        firstValueFrom(this.paymentMethodsService.findActive()),
      ]);
      this.registers.set(registers);
      this.products.set(products);
      this.customers.set(customers);
      this.paymentMethods.set(paymentMethods);
      this.selectInitialOpening(registers);
    } catch (error) {
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private selectInitialOpening(registers: CashRegister[]): void {
    const personId = this.authStore.person()?.id;
    const currentOpeningId = this.selectedOpeningId();
    const opening = registers.find((register) => {
      const opening = register.openOpening;
      return (
        opening !== null && opening.responsible.id === personId && opening.id === currentOpeningId
      );
    })?.openOpening;
    const firstOpening = registers.find(
      (register) => register.openOpening?.responsible.id === personId,
    )?.openOpening;
    this.selectedOpeningId.set(opening?.id ?? firstOpening?.id ?? null);
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'No se pudo cargar la información de ventas');
  }
}
