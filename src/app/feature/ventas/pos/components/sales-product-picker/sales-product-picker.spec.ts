import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { Product } from '../../../../../core/models/product.model';
import { SalesProductPicker } from './sales-product-picker';

const product: Product = {
  id: 1,
  stock: 30,
  lowStockThreshold: null,
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

describe('SalesProductPicker', () => {
  beforeEach(async () =>
    TestBed.configureTestingModule({ imports: [SalesProductPicker] }).compileComponents(),
  );

  it('adds the unit selected in the catalog', () => {
    const fixture = TestBed.createComponent(SalesProductPicker);
    fixture.componentRef.setInput('page', 1);
    fixture.componentRef.setInput('result', {
      data: [product],
      total: 1,
      page: 1,
      limit: 20,
      lastPage: 1,
    });
    fixture.detectChanges();

    let added: { product: Product; unit: Product['units'][number] } | undefined;
    fixture.componentInstance.productAdded.subscribe((selection) => (added = selection));
    const select = fixture.debugElement.query(By.css('tbody select')).nativeElement as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.debugElement.query(By.css('tbody button')).nativeElement.click();

    expect(added).toEqual({ product, unit: product.units[1] });
  });
});
