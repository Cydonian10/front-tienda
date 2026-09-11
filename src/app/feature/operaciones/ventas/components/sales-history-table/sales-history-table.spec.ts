import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { Sale } from '../../../../../core/models/sale.model';
import { SalesHistoryTable } from './sales-history-table';

const pendingSale: Sale = {
  id: 1,
  saleDate: '2026-09-11T10:00:00.000Z',
  customerId: 3,
  customerName: 'Cliente Uno',
  sellerId: 2,
  sellerName: 'Vendedor Uno',
  cashOpeningId: 4,
  discount: 0,
  totalAmount: 10,
  status: 'PENDING',
  paidAt: null,
  cancelledAt: null,
  cancelledById: null,
  cancellationReason: null,
  payment: null,
  details: [],
};

describe('SalesHistoryTable', () => {
  beforeEach(async () =>
    TestBed.configureTestingModule({ imports: [SalesHistoryTable] }).compileComponents(),
  );

  it('shows pending actions and lets the original seller request cancellation', () => {
    const fixture = TestBed.createComponent(SalesHistoryTable);
    fixture.componentRef.setInput('sales', [pendingSale]);
    fixture.componentRef.setInput('currentPersonId', 2);
    fixture.detectChanges();

    let cancelled: Sale | undefined;
    fixture.componentInstance.cancelRequested.subscribe((sale) => (cancelled = sale));
    const buttons = fixture.debugElement.queryAll(By.css('tbody button'));

    expect(buttons.map((button) => button.nativeElement.textContent.trim())).toEqual([
      'Ver',
      'Editar',
      'Cobrar',
      'Cancelar',
    ]);
    buttons[3].nativeElement.click();
    expect(cancelled).toBe(pendingSale);
  });

  it('hides cancellation from a worker who did not create the sale', () => {
    const fixture = TestBed.createComponent(SalesHistoryTable);
    fixture.componentRef.setInput('sales', [pendingSale]);
    fixture.componentRef.setInput('currentPersonId', 9);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('tbody button'))).toHaveLength(3);
  });
});
