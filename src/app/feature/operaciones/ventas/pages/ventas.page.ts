import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PaymentMethodsService } from '../../../../core/api/payment-methods.service';
import { PeopleService } from '../../../../core/api/people.service';
import { ProductsService } from '../../../../core/api/products.service';
import { SalesService } from '../../../../core/api/sales.service';
import {
  CashRegister,
  CashRegisterOpeningSummary,
} from '../../../../core/models/cash-register.model';
import { PaymentMethod } from '../../../../core/models/payment-method.model';
import { PaginatedResult } from '../../../../core/models/pagination.model';
import { Person } from '../../../../core/models/people.model';
import { Product } from '../../../../core/models/product.model';
import { Sale, SaleCartLine, SaleFilter } from '../../../../core/models/sale.model';
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import PaginationNg from '../../../../shared/pagination/pagination.ng';
import { SaleCart } from '../components/sale-cart/sale-cart';
import { SalesFilters, SalesHistoryFilters } from '../components/sales-filters/sales-filters';
import { SalesHistoryTable } from '../components/sales-history-table/sales-history-table';
import { SalesProductPicker } from '../components/sales-product-picker/sales-product-picker';
import { openSaleCancellationDialog } from '../dialogs/sale-cancellation-dialog';
import { openSaleDetailDialog } from '../dialogs/sale-detail-dialog';
import { openSalePaymentDialog } from '../dialogs/sale-payment-dialog';

@Component({
  selector: 'ventas-page',
  imports: [
    BreadcrumbsNg,
    PaginationNg,
    RouterLink,
    SaleCart,
    SalesFilters,
    SalesHistoryTable,
    SalesProductPicker,
  ],
  templateUrl: './ventas.page.html',
})
export default class VentasPage {
  private readonly dialog = inject(Dialog);
  private readonly cashRegistersService = inject(CashRegistersService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly peopleService = inject(PeopleService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly authStore = inject(AuthStore);

  protected readonly registers = signal<CashRegister[]>([]);
  protected readonly products = signal<PaginatedResult<Product> | null>(null);
  protected readonly customers = signal<PaginatedResult<Person> | null>(null);
  protected readonly paymentMethods = signal<PaymentMethod[]>([]);
  protected readonly selectedOpeningId = signal<number | null>(null);
  protected readonly cartLines = signal<SaleCartLine[]>([]);
  protected readonly customerId = signal<number | null>(null);
  protected readonly discount = signal(0);
  protected readonly editingSale = signal<Sale | null>(null);
  protected readonly productSearch = signal('');
  protected readonly productPage = signal(1);
  protected readonly customerPage = signal(1);
  protected readonly historyPage = signal(1);
  protected readonly historyPageSize = signal(20);
  protected readonly history = signal<PaginatedResult<Sale> | null>(null);
  protected readonly historyFilters = signal<SalesHistoryFilters>(this.defaultHistoryFilters());
  protected readonly isLoading = signal(true);
  protected readonly isLoadingProducts = signal(false);
  protected readonly isLoadingHistory = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly catalogError = signal<string | null>(null);
  protected readonly historyError = signal<string | null>(null);
  protected readonly canManage = computed(
    () => this.authStore.user()?.roles.includes('ADMINISTRADOR') ?? false,
  );
  protected readonly currentPersonId = computed(() => this.authStore.person()?.id ?? null);
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
  protected readonly subtotal = computed(() =>
    this.cartLines().reduce((total, line) => total + line.product.price * line.quantity, 0),
  );
  protected readonly total = computed(() => this.subtotal() - this.discount());
  protected readonly canSubmitSale = computed(
    () =>
      this.selectedOpening() !== null &&
      this.customerId() !== null &&
      this.cartLines().length > 0 &&
      this.discount() >= 0 &&
      this.discount() <= this.subtotal(),
  );

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

  protected addProduct(product: Product): void {
    this.cartLines.update((lines) => {
      const existing = lines.find((line) => line.product.id === product.id);
      if (!existing) return [...lines, { product, quantity: 1 }];
      return lines.map((line) =>
        line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
      );
    });
  }

  protected updateQuantity({ productId, quantity }: { productId: number; quantity: number }): void {
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error('La cantidad debe ser un entero positivo');
      return;
    }
    this.cartLines.update((lines) =>
      lines.map((line) => (line.product.id === productId ? { ...line, quantity } : line)),
    );
  }

  protected removeLine(productId: number): void {
    this.cartLines.update((lines) => lines.filter((line) => line.product.id !== productId));
  }

  protected updateDiscount(discount: number): void {
    this.discount.set(Number.isFinite(discount) && discount >= 0 ? discount : 0);
  }

  protected updateCustomer(customerId: number | null): void {
    this.customerId.set(customerId);
  }

  protected searchProducts(search: string): void {
    this.productSearch.set(search);
    this.productPage.set(1);
    void this.loadProducts();
  }

  protected changeProductPage(page: number): void {
    this.productPage.set(page);
    void this.loadProducts();
  }

  protected changeCustomerPage(page: number): void {
    this.customerPage.set(page);
    void this.loadCustomers();
  }

  protected async savePending(): Promise<Sale | null> {
    if (!this.canSubmitSale()) {
      toast.error('Selecciona una sesión, un cliente y al menos un producto con descuento válido');
      return null;
    }
    const opening = this.selectedOpening();
    const customerId = this.customerId();
    if (!opening || !customerId) return null;

    this.isSaving.set(true);
    try {
      const dto = {
        customerId,
        discount: this.discount(),
        details: this.cartLines().map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      };
      const current = this.editingSale();
      const sale = current
        ? await firstValueFrom(this.salesService.update(current.id, dto))
        : await firstValueFrom(this.salesService.create({ ...dto, cashOpeningId: opening.id }));
      this.editingSale.set(sale);
      toast.success(current ? 'Venta pendiente actualizada' : 'Venta pendiente guardada');
      await this.loadHistory();
      return sale;
    } catch (error) {
      toast.error(this.message(error));
      return null;
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async editSale(sale: Sale): Promise<void> {
    await this.loadPendingSale(sale);
  }

  protected async paySale(sale: Sale): Promise<void> {
    if (await this.loadPendingSale(sale)) await this.payCurrentSale();
  }

  protected async payCurrentSale(): Promise<void> {
    const sale = await this.savePending();
    if (!sale) return;
    if (this.paymentMethods().length === 0) {
      toast.error('No hay métodos de pago activos para cobrar la venta');
      return;
    }
    const ref = openSalePaymentDialog(this.dialog, {
      sale,
      paymentMethods: this.paymentMethods(),
    });
    ref.closed.subscribe((paidSale) => {
      if (!paidSale) return;
      toast.success('Venta cobrada correctamente');
      this.resetCart();
      void this.loadHistory();
    });
  }

  protected showDetail(sale: Sale): void {
    openSaleDetailDialog(this.dialog, sale);
  }

  protected cancelSale(sale: Sale): void {
    const ref = openSaleCancellationDialog(this.dialog, sale);
    ref.closed.subscribe((cancelledSale) => {
      if (!cancelledSale) return;
      if (this.editingSale()?.id === cancelledSale.id) this.resetCart();
      toast.success('Venta cancelada correctamente');
      void this.loadHistory();
    });
  }

  protected updateHistoryFilters(patch: Partial<SalesHistoryFilters>): void {
    this.historyFilters.update((filters) => ({ ...filters, ...patch }));
  }

  protected applyHistoryFilters(): void {
    this.historyPage.set(1);
    void this.loadHistory();
  }

  protected clearHistoryFilters(): void {
    this.historyFilters.set(this.defaultHistoryFilters());
    this.historyPage.set(1);
    void this.loadHistory();
  }

  protected changeHistoryPage(page: number): void {
    this.historyPage.set(page);
    void this.loadHistory();
  }

  protected changeHistoryPageSize(pageSize: number): void {
    this.historyPageSize.set(pageSize);
    this.historyPage.set(1);
    void this.loadHistory();
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
      const [registers, paymentMethods] = await Promise.all([
        firstValueFrom(this.cashRegistersService.findAll()),
        firstValueFrom(this.paymentMethodsService.findActive()),
      ]);
      this.registers.set(registers);
      this.paymentMethods.set(paymentMethods);
      this.selectInitialOpening(registers);
      await Promise.all([this.loadProducts(), this.loadCustomers(), this.loadHistory()]);
    } catch (error) {
      this.error.set(this.message(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadProducts(): Promise<void> {
    this.isLoadingProducts.set(true);
    this.catalogError.set(null);
    try {
      this.products.set(
        await firstValueFrom(
          this.productsService.findAll({
            page: this.productPage(),
            limit: 20,
            search: this.productSearch().trim() || undefined,
          }),
        ),
      );
    } catch (error) {
      this.products.set(null);
      this.catalogError.set(this.message(error));
    } finally {
      this.isLoadingProducts.set(false);
    }
  }

  private async loadCustomers(): Promise<void> {
    try {
      this.customers.set(
        await firstValueFrom(this.peopleService.findAll({ page: this.customerPage(), limit: 20 })),
      );
    } catch (error) {
      this.customers.set(null);
      this.catalogError.set(this.message(error));
    }
  }

  private async loadHistory(): Promise<void> {
    this.isLoadingHistory.set(true);
    this.historyError.set(null);
    try {
      this.history.set(await firstValueFrom(this.salesService.findAll(this.saleFilter())));
    } catch (error) {
      this.historyError.set(this.message(error));
    } finally {
      this.isLoadingHistory.set(false);
    }
  }

  private async loadPendingSale(sale: Sale): Promise<boolean> {
    if (sale.status !== 'PENDING') return false;
    this.isSaving.set(true);
    try {
      const productIds = [...new Set(sale.details.map((detail) => detail.productId))];
      const [products, customer] = await Promise.all([
        Promise.all(productIds.map((id) => firstValueFrom(this.productsService.findOne(id)))),
        firstValueFrom(this.peopleService.findOne(sale.customerId)),
      ]);
      const quantities = sale.details.reduce((items, detail) => {
        items.set(detail.productId, (items.get(detail.productId) ?? 0) + detail.quantity);
        return items;
      }, new Map<number, number>());
      this.cartLines.set(
        products.map((product) => ({ product, quantity: quantities.get(product.id) ?? 0 })),
      );
      this.customerId.set(customer.id);
      this.customers.update((result) =>
        result && !result.data.some((item) => item.id === customer.id)
          ? { ...result, data: [customer, ...result.data] }
          : result,
      );
      this.discount.set(sale.discount);
      this.editingSale.set(sale);
      if (this.ownRegisters().some((register) => register.openOpening?.id === sale.cashOpeningId)) {
        this.selectedOpeningId.set(sale.cashOpeningId);
      }
      return true;
    } catch (error) {
      toast.error(this.message(error));
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetCart(): void {
    this.cartLines.set([]);
    this.customerId.set(null);
    this.discount.set(0);
    this.editingSale.set(null);
  }

  private saleFilter(): SaleFilter {
    const filters = this.historyFilters();
    return {
      page: this.historyPage(),
      limit: this.historyPageSize(),
      status: filters.status || undefined,
      cashOpeningId: this.positiveInteger(filters.cashOpeningId),
      sellerId: this.canManage() ? this.positiveInteger(filters.sellerId) : undefined,
      startDate: filters.startDate ? this.startOfDay(filters.startDate) : undefined,
      endDate: filters.endDate ? this.endOfDay(filters.endDate) : undefined,
    };
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

  private defaultHistoryFilters(): SalesHistoryFilters {
    const today = this.localDate(new Date());
    return { status: '', cashOpeningId: '', sellerId: '', startDate: today, endDate: today };
  }

  private positiveInteger(value: string): number | undefined {
    const number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : undefined;
  }

  private startOfDay(value: string): string {
    return new Date(`${value}T00:00:00`).toISOString();
  }

  private endOfDay(value: string): string {
    return new Date(`${value}T23:59:59.999`).toISOString();
  }

  private localDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'Error inesperado');
  }
}
