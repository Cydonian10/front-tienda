import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseProductsService } from '../../../../../core/api/base-products.service';
import { BrandsService } from '../../../../../core/api/brands.service';
import { CategoriesService } from '../../../../../core/api/categories.service';
import { MeasurementUnitsService } from '../../../../../core/api/measurement-units.service';
import NewBaseProductPage from './new-base-product.page';

describe('NewBaseProductPage', () => {
  const baseProductsService = { create: vi.fn() };
  const brandsService = { findAll: vi.fn() };
  const categoriesService = { findAll: vi.fn() };
  const measurementUnitsService = { findAll: vi.fn() };
  const pageResult = { data: [], total: 0, page: 1, limit: 100, lastPage: 1 };

  beforeEach(async () => {
    vi.clearAllMocks();
    brandsService.findAll.mockReturnValue(of(pageResult));
    categoriesService.findAll.mockReturnValue(of(pageResult));
    measurementUnitsService.findAll.mockReturnValue(
      of({ ...pageResult, data: [{ id: 1, name: 'Unidad', value: 'u' }] }),
    );
    baseProductsService.create.mockReturnValue(
      of({
        baseProduct: {
          id: 2,
          name: 'Clavo',
          productCount: 1,
          unitCount: 1,
          brand: { id: 4, name: 'Acme' },
          categories: [{ id: 5, name: 'Construcción' }],
        },
        defaultProduct: {
          id: 3,
          name: 'Clavo',
          stock: 12,
          price: 4.5,
          baseProductId: 2,
          baseProductName: 'Clavo',
          productAttributes: [],
          stockLabel: '12 u',
          units: [{ unitId: 1, unitName: 'Unidad', unitValue: 'u', isMain: true, factor: 1 }],
        },
      }),
    );
    await TestBed.configureTestingModule({
      imports: [NewBaseProductPage],
      providers: [
        { provide: BaseProductsService, useValue: baseProductsService },
        { provide: BrandsService, useValue: brandsService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: MeasurementUnitsService, useValue: measurementUnitsService },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  it('sends initial stock and price and stores the default product', async () => {
    const fixture = TestBed.createComponent(NewBaseProductPage);
    await fixture.whenStable();
    const page = fixture.componentInstance as any;
    page.form.patchValue({
      name: ' Clavo ',
      brandId: '4',
      categoryIds: [5],
      initialStock: 12,
      initialPrice: 4.5,
    });
    page.unitRows.at(0).patchValue({ unitId: '1', factor: 1, isMain: true });

    await page.onSubmit();

    expect(baseProductsService.create).toHaveBeenCalledWith({
      name: 'Clavo',
      units: [{ unitId: 1, factor: 1, isMain: true }],
      brandId: 4,
      categoryIds: [5],
      initialStock: 12,
      initialPrice: 4.5,
    });
    expect(page.createdProduct().baseProduct.brand.name).toBe('Acme');
    expect(page.createdProduct().defaultProduct.stockLabel).toBe('12 u');
  });

  it('rejects negative initial stock and price', async () => {
    const fixture = TestBed.createComponent(NewBaseProductPage);
    await fixture.whenStable();
    const page = fixture.componentInstance as any;
    page.form.patchValue({ name: 'Clavo', initialStock: -1, initialPrice: -1 });
    page.unitRows.at(0).patchValue({ unitId: '1', factor: 1, isMain: true });

    await page.onSubmit();

    expect(page.form.controls.initialStock.hasError('min')).toBe(true);
    expect(page.form.controls.initialPrice.hasError('min')).toBe(true);
    expect(baseProductsService.create).not.toHaveBeenCalled();
  });
});
