import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttributesService } from '../../../../core/api/attributes.service';
import { BaseProductsService } from '../../../../core/api/base-products.service';
import { ProductsService } from '../../../../core/api/products.service';
import NewProductPage from './new-product.page';

describe('NewProductPage', () => {
  const attributesService = {
    findAllWithValues: vi.fn(),
  };
  const baseProductsService = {
    findAll: vi.fn(),
    findDetail: vi.fn(),
  };
  const productsService = {
    create: vi.fn(),
  };
  const router = {
    events: of(),
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    attributesService.findAllWithValues.mockReturnValue(
      of({
        data: [
          {
            id: 7,
            name: 'Color',
            values: [{ id: 70, value: 'Rojo' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        lastPage: 1,
      }),
    );
    baseProductsService.findAll.mockReturnValue(
      of({ data: [{ id: 3, name: 'Martillo' }], total: 1, page: 1, limit: 10, lastPage: 1 }),
    );
    baseProductsService.findDetail.mockReturnValue(of(null));
    productsService.create.mockReturnValue(of({ id: 12 }));

    await TestBed.configureTestingModule({
      imports: [NewProductPage],
      providers: [
        { provide: AttributesService, useValue: attributesService },
        { provide: BaseProductsService, useValue: baseProductsService },
        { provide: ProductsService, useValue: productsService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  async function createPage() {
    const fixture = TestBed.createComponent(NewProductPage);
    await fixture.whenStable();
    return fixture.componentInstance as any;
  }

  it('builds the expected payload from a valid form', async () => {
    const page = await createPage();
    page.form.patchValue({
      baseProductId: 3,
      stock: 12,
      price: 29.9,
    });
    page.attributeRows.at(0).patchValue({ attributeId: 7, attributeValueId: 70 });

    await page.onSubmit();

    expect(productsService.create).toHaveBeenCalledWith({
      baseProductId: 3,
      stock: 12,
      price: 29.9,
      productAttributes: [{ attributeId: 7, attributeValueId: 70, order: 10 }],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/mantenimiento/productos']);
  });

  it('does not submit without at least one complete attribute pair', async () => {
    const page = await createPage();
    page.form.patchValue({
      baseProductId: 3,
      stock: 12,
      price: 29.9,
    });

    await page.onSubmit();

    expect(page.form.hasError('attributeRequired')).toBe(true);
    expect(productsService.create).not.toHaveBeenCalled();
  });

  it('assigns buffered orders when adding and moving attributes', async () => {
    const page = await createPage();
    page.form.patchValue({
      baseProductId: 3,
      stock: 12,
      price: 29.9,
    });
    page.attributeRows.at(0).patchValue({ attributeId: 7, attributeValueId: 70 });

    page.addAttribute();
    page.attributeRows.at(1).patchValue({ attributeId: 8, attributeValueId: 80 });
    page.addAttribute();
    page.attributeRows.at(2).patchValue({ attributeId: 9, attributeValueId: 90 });

    page.dropAttribute({ previousIndex: 2, currentIndex: 0 });

    expect(page.attributeRows.controls.map((row: any) => row.controls.order.value)).toEqual([
      5, 10, 20,
    ]);

    await page.onSubmit();

    expect(productsService.create).toHaveBeenCalledWith({
      baseProductId: 3,
      stock: 12,
      price: 29.9,
      productAttributes: [
        { attributeId: 9, attributeValueId: 90, order: 5 },
        { attributeId: 7, attributeValueId: 70, order: 10 },
        { attributeId: 8, attributeValueId: 80, order: 20 },
      ],
    });
  });

  it('rejects missing or non-positive stock and price', async () => {
    const page = await createPage();
    page.form.patchValue({
      baseProductId: 3,
      stock: 0,
      price: -1,
    });
    page.attributeRows.at(0).patchValue({ attributeId: 7, attributeValueId: 70 });

    await page.onSubmit();

    expect(page.form.controls.stock.hasError('min')).toBe(true);
    expect(page.form.controls.price.hasError('min')).toBe(true);
    expect(productsService.create).not.toHaveBeenCalled();
  });
});
