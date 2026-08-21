import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BaseProductsService } from '../../../../../core/api/base-products.service';
import { BrandsService } from '../../../../../core/api/brands.service';
import { CategoriesService } from '../../../../../core/api/categories.service';
import { MeasurementUnitsService } from '../../../../../core/api/measurement-units.service';
import EditBaseProductPage from './edit-base-product.page';

describe('EditBaseProductPage', () => {
  const baseProductsService = { findDetail: vi.fn(), update: vi.fn() };
  const brandsService = { findAll: vi.fn() };
  const categoriesService = { findAll: vi.fn() };
  const measurementUnitsService = { findAll: vi.fn() };
  const router = { events: of(), navigate: vi.fn() };
  const pageResult = { data: [], total: 0, page: 1, limit: 100, lastPage: 1 };

  beforeEach(async () => {
    vi.clearAllMocks();
    brandsService.findAll.mockReturnValue(of(pageResult));
    categoriesService.findAll.mockReturnValue(of(pageResult));
    measurementUnitsService.findAll.mockReturnValue(
      of({ ...pageResult, data: [{ id: 1, name: 'Unidad', value: 'u' }] }),
    );
    baseProductsService.findDetail.mockReturnValue(
      of({
        id: 2,
        name: 'Clavo',
        productCount: 1,
        brand: { id: 4, name: 'Marca' },
        categories: [{ id: 5, name: 'Construcción' }],
        units: [{ id: 1, name: 'Unidad', value: 'u', factor: 1, isMain: true }],
      }),
    );
    baseProductsService.update.mockReturnValue(of({ id: 2 }));
    await TestBed.configureTestingModule({
      imports: [EditBaseProductPage],
      providers: [
        { provide: BaseProductsService, useValue: baseProductsService },
        { provide: BrandsService, useValue: brandsService },
        { provide: CategoriesService, useValue: categoriesService },
        { provide: MeasurementUnitsService, useValue: measurementUnitsService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '2' }, pathFromRoot: [] } },
        },
      ],
    }).compileComponents();
  });

  it('sends an update payload with the edited units', async () => {
    const fixture = TestBed.createComponent(EditBaseProductPage);
    await fixture.whenStable();
    const page = fixture.componentInstance as any;
    page.form.patchValue({ name: 'Clavo galvanizado', brandId: '', categoryIds: [6] });
    page.unitRows.at(0).patchValue({ unitId: '1', factor: 2, isMain: true });

    await page.onSubmit();

    expect(baseProductsService.update).toHaveBeenCalledWith(2, {
      name: 'Clavo galvanizado',
      units: [{ unitId: 1, factor: 2, isMain: true }],
      brandId: null,
      categoryIds: [6],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/mantenimiento/base-products']);
  });
});
