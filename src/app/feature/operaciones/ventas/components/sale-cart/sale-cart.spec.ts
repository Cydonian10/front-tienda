import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { SaleCartLine } from '../../../../../core/models/sale.model';
import { SaleCart } from './sale-cart';

const line: SaleCartLine = {
  product: {
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
  },
  unit: { unitId: 2, unitName: 'Caja', unitValue: 'cj', factor: 12, isMain: false },
  quantity: 1.5,
};

describe('SaleCart', () => {
  beforeEach(async () => TestBed.configureTestingModule({ imports: [SaleCart] }).compileComponents());

  it('emits the line identity when changing quantity or presentation', () => {
    const fixture = TestBed.createComponent(SaleCart);
    fixture.componentRef.setInput('lines', [line]);
    fixture.componentRef.setInput('customerPage', 1);
    fixture.detectChanges();

    let quantityChange: unknown;
    let unitChange: unknown;
    fixture.componentInstance.quantityChanged.subscribe((change) => (quantityChange = change));
    fixture.componentInstance.unitChanged.subscribe((change) => (unitChange = change));
    const unitSelect = fixture.debugElement.query(By.css('tbody select')).nativeElement as HTMLSelectElement;
    unitSelect.value = '1';
    unitSelect.dispatchEvent(new Event('change'));
    const quantityInput = fixture.debugElement.query(By.css('tbody input')).nativeElement as HTMLInputElement;
    quantityInput.value = '2.5';
    quantityInput.dispatchEvent(new Event('change'));

    expect(unitChange).toEqual({ productId: 1, currentUnitId: 2, unitId: 1 });
    expect(quantityChange).toEqual({ productId: 1, unitId: 2, quantity: 2.5 });
  });
});
