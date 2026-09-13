import { Dialog } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { Product, ProductUnit } from '../../../../core/models/product.model';
import { ROLE_NAMES } from '../../../../core/models/role.model';
import { Sale, SaleCartLine } from '../../../../core/models/sale.model';
import { AuthStore } from '../../../../core/store/auth.store';
import BreadcrumbsNg from '../../../../shared/breadcrumbs/breadcrumbs.ng';
import { SaleCart } from '../components/sale-cart/sale-cart';
import { SalesProductPicker } from '../components/sales-product-picker/sales-product-picker';
import { openSalePaymentDialog } from '../../dialogs/sale-payment-dialog';

@Component({
  selector: 'ventas-page',
  imports: [BreadcrumbsNg, RouterLink, SaleCart, SalesProductPicker],
  templateUrl: './venta.page.html',
})
export default class VentasPage implements OnDestroy {
  private readonly dialog = inject(Dialog);
  private readonly cashRegistersService = inject(CashRegistersService);
  private readonly paymentMethodsService = inject(PaymentMethodsService);
  private readonly peopleService = inject(PeopleService);
  private readonly productsService = inject(ProductsService);
  private readonly salesService = inject(SalesService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private productSearchTimer: ReturnType<typeof setTimeout> | null = null;

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
  protected readonly recentSales = signal<PaginatedResult<Sale> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isLoadingProducts = signal(false);
  protected readonly isLoadingRecentSales = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly catalogError = signal<string | null>(null);
  protected readonly recentSalesError = signal<string | null>(null);
  protected readonly isWorker = computed(
    () => this.authStore.user()?.roles.includes(ROLE_NAMES.WORKER) ?? false,
  );
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
    this.round2(this.cartLines().reduce((total, line) => total + this.lineSubtotal(line), 0)),
  );
  protected readonly total = computed(() => this.round2(this.subtotal() - this.discount()));
  protected readonly canSubmitSale = computed(
    () =>
      this.selectedOpening() !== null &&
      this.customerId() !== null &&
      this.cartLines().length > 0 &&
      this.discount() >= 0 &&
      this.discount() <= this.subtotal(),
  );

  constructor() {
    const state = this.router.getCurrentNavigation()?.extras.state as
      { sale?: Sale; collect?: boolean } | undefined;
    void this.loadInitialData(state?.sale, state?.collect ?? false);
  }

  protected async reload(): Promise<void> {
    await this.loadInitialData();
  }

  protected selectOpening(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.selectedOpeningId.set(Number.isInteger(value) && value > 0 ? value : null);
  }

  protected addProduct({ product, unit }: { product: Product; unit: ProductUnit }): void {
    this.cartLines.update((lines) => {
      const existing = lines.find(
        (line) => line.product.id === product.id && line.unit.unitId === unit.unitId,
      );
      if (!existing) return [...lines, { product, unit, quantity: 1 }];
      return lines.map((line) =>
        line.product.id === product.id && line.unit.unitId === unit.unitId
          ? { ...line, quantity: this.round2(line.quantity + 1) }
          : line,
      );
    });
  }

  protected updateQuantity({
    productId,
    unitId,
    quantity,
  }: {
    productId: number;
    unitId: number;
    quantity: number;
  }): void {
    if (!this.isValidQuantity(quantity)) {
      toast.error('La cantidad debe ser positiva y tener máximo dos decimales');
      return;
    }
    this.cartLines.update((lines) =>
      lines.map((line) =>
        line.product.id === productId && line.unit.unitId === unitId ? { ...line, quantity } : line,
      ),
    );
  }

  protected updateUnit({
    productId,
    currentUnitId,
    unitId,
  }: {
    productId: number;
    currentUnitId: number;
    unitId: number;
  }): void {
    if (currentUnitId === unitId) return;
    this.cartLines.update((lines) => {
      const currentLine = lines.find(
        (line) => line.product.id === productId && line.unit.unitId === currentUnitId,
      );
      const unit = currentLine?.product.units.find((item) => item.unitId === unitId);
      if (!currentLine || !unit) return lines;

      const targetLine = lines.find(
        (line) => line.product.id === productId && line.unit.unitId === unitId,
      );
      if (!targetLine) {
        return lines.map((line) => (line === currentLine ? { ...line, unit } : line));
      }
      return lines
        .filter((line) => line !== currentLine && line !== targetLine)
        .concat({
          ...targetLine,
          quantity: this.round2(targetLine.quantity + currentLine.quantity),
        });
    });
  }

  protected removeLine({ productId, unitId }: { productId: number; unitId: number }): void {
    this.cartLines.update((lines) =>
      lines.filter((line) => line.product.id !== productId || line.unit.unitId !== unitId),
    );
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
    if (this.productSearchTimer) clearTimeout(this.productSearchTimer);
    this.productSearchTimer = setTimeout(() => {
      this.productSearchTimer = null;
      void this.loadProducts();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.productSearchTimer) clearTimeout(this.productSearchTimer);
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
          unitId: line.unit.unitId,
          quantity: line.quantity,
        })),
      };
      const current = this.editingSale();
      const sale = current
        ? await firstValueFrom(this.salesService.update(current.id, dto))
        : await firstValueFrom(this.salesService.create({ ...dto, cashOpeningId: opening.id }));
      this.editingSale.set(sale);
      toast.success(current ? 'Venta pendiente actualizada' : 'Venta pendiente guardada');
      await this.loadRecentSales();
      return sale;
    } catch (error) {
      toast.error(this.message(error));
      return null;
    } finally {
      this.isSaving.set(false);
    }
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
      void this.loadRecentSales();
    });
  }

  private async loadInitialData(saleToRestore?: Sale, collect = false): Promise<void> {
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
      await Promise.all([this.loadProducts(), this.loadCustomers(), this.loadRecentSales()]);
      if (saleToRestore && (await this.loadPendingSale(saleToRestore)) && collect) {
        await this.payCurrentSale();
      }
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

  protected async loadRecentSales(): Promise<void> {
    if (!this.isWorker()) return;
    this.isLoadingRecentSales.set(true);
    this.recentSalesError.set(null);
    try {
      this.recentSales.set(await firstValueFrom(this.salesService.findAll({ page: 1, limit: 5 })));
    } catch (error) {
      this.recentSales.set(null);
      this.recentSalesError.set(this.message(error));
    } finally {
      this.isLoadingRecentSales.set(false);
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
      const productsById = new Map(products.map((product) => [product.id, product]));
      this.cartLines.set(
        sale.details.map((detail) => {
          const product = productsById.get(detail.productId);
          const unit = product?.units.find((item) => item.unitId === detail.unitId);
          if (!product || !unit) {
            throw new Error(`La presentación de ${detail.productName} ya no está disponible`);
          }
          return { product, unit, quantity: detail.quantity };
        }),
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
      : (body?.message ?? 'Error inesperado');
  }

  private presentationPrice(line: SaleCartLine): number {
    return this.round2(line.product.price * line.unit.factor);
  }

  private lineSubtotal(line: SaleCartLine): number {
    return this.round2(this.presentationPrice(line) * line.quantity);
  }

  private isValidQuantity(quantity: number): boolean {
    return Number.isFinite(quantity) && quantity > 0 && Number(quantity.toFixed(2)) === quantity;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
