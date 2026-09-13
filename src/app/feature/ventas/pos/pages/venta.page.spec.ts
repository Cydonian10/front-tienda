import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { PaymentMethodsService } from '../../../../core/api/payment-methods.service';
import { PeopleService } from '../../../../core/api/people.service';
import { ProductsService } from '../../../../core/api/products.service';
import { SalesService } from '../../../../core/api/sales.service';
import { Product } from '../../../../core/models/product.model';
import { Sale } from '../../../../core/models/sale.model';
import { AuthStore } from '../../../../core/store/auth.store';
import VentasPage from './venta.page';

describe('VentasPage', () => {
  const product: Product = {
    id: 1,
    stock: 30,
    price: 10,
    baseProductId: 1,
    baseProductName: 'Tornillo',
    productAttributes: [],
    stockLabel: '30 u',
    units: [
      { unitId: 1, unitName: 'Unidad', unitValue: 'u', factor: 1, isMain: true },
      { unitId: 2, unitName: 'Caja', unitValue: 'cj', factor: 12, isMain: false },
    ],
  };
  const registersService = { findAll: vi.fn() };
  const paymentMethodsService = { findActive: vi.fn() };
  const peopleService = { findAll: vi.fn(), findOne: vi.fn() };
  const productsService = { findAll: vi.fn(), findOne: vi.fn() };
  const salesService = { findAll: vi.fn(), create: vi.fn(), update: vi.fn() };
  const authStore = {
    person: vi.fn(() => ({ id: 2, firstName: 'Ana', lastName: 'Pérez' })),
    user: vi.fn(() => ({ roles: ['TRABAJADOR'] })),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    registersService.findAll.mockReturnValue(
      of([
        {
          id: 1,
          code: 'CAJA-01',
          name: 'Principal',
          active: true,
          openOpening: {
            id: 4,
            openedAt: '2026-09-11T10:00:00.000Z',
            openingAmount: 100,
            status: 'open',
            responsible: { id: 2, firstName: 'Ana', lastName: 'Pérez' },
          },
        },
      ]),
    );
    paymentMethodsService.findActive.mockReturnValue(
      of([{ id: 1, name: 'Efectivo', active: true }]),
    );
    peopleService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 20, lastPage: 0 }),
    );
    productsService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 20, lastPage: 0 }),
    );
    salesService.findAll.mockReturnValue(
      of({ data: [], total: 0, page: 1, limit: 20, lastPage: 0 }),
    );

    await TestBed.configureTestingModule({
      imports: [VentasPage],
      providers: [
        { provide: CashRegistersService, useValue: registersService },
        { provide: PaymentMethodsService, useValue: paymentMethodsService },
        { provide: PeopleService, useValue: peopleService },
        { provide: ProductsService, useValue: productsService },
        { provide: SalesService, useValue: salesService },
        { provide: AuthStore, useValue: authStore },
        { provide: Dialog, useValue: { open: vi.fn() } },
        { provide: Router, useValue: { events: of(), getCurrentNavigation: vi.fn(() => null) } },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  it('loads operational data and selects the authenticated responsible opening', async () => {
    const fixture = TestBed.createComponent(VentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    const page = fixture.componentInstance as any;

    await vi.waitFor(() => expect(page.selectedOpeningId()).toBe(4));
    expect(productsService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20, search: undefined });
    expect(peopleService.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(salesService.findAll).toHaveBeenCalled();
  });

  it('restores each pending detail with its original presentation', async () => {
    const fixture = TestBed.createComponent(VentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    productsService.findOne.mockReturnValue(of(product));
    peopleService.findOne.mockReturnValue(of({ id: 3, firstName: 'Cliente', lastName: 'Uno' }));
    const sale: Sale = {
      id: 8,
      saleDate: '2026-09-11T10:00:00.000Z',
      customerId: 3,
      customerName: 'Cliente Uno',
      sellerId: 2,
      sellerName: 'Ana Pérez',
      cashOpeningId: 4,
      discount: 0,
      totalAmount: 130,
      status: 'PENDING',
      paidAt: null,
      cancelledAt: null,
      cancelledById: null,
      cancellationReason: null,
      payment: null,
      details: [
        {
          id: 1,
          productId: 1,
          productName: 'Tornillo',
          unitId: 1,
          unitName: 'Unidad',
          unitValue: 'u',
          unitFactor: 1,
          quantity: 1,
          unitPrice: 10,
          subtotal: 10,
        },
        {
          id: 2,
          productId: 1,
          productName: 'Tornillo',
          unitId: 2,
          unitName: 'Caja',
          unitValue: 'cj',
          unitFactor: 12,
          quantity: 2,
          unitPrice: 60,
          subtotal: 120,
        },
      ],
    };
    const page = fixture.componentInstance as any;

    await expect(page.loadPendingSale(sale)).resolves.toBe(true);
    expect(page.cartLines()).toEqual([
      { product, unit: product.units[0], quantity: 1 },
      { product, unit: product.units[1], quantity: 2 },
    ]);
  });

  it('only loads the compact recent-sales panel for a worker', async () => {
    authStore.user.mockReturnValue({ roles: ['RESPONSABLE'] });
    const fixture = TestBed.createComponent(VentasPage);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(salesService.findAll).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Tus ventas recientes');
  });
});
