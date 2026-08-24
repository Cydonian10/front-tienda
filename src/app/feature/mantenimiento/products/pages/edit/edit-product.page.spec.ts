import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttributesService } from '../../../../../core/api/attributes.service';
import { ProductsService } from '../../../../../core/api/products.service';
import EditProductPage from './edit-product.page';

describe('EditProductPage', () => {
  const attributesService = { findAllWithValues: vi.fn() };
  const productsService = { findOne: vi.fn(), update: vi.fn() };
  const router = { events: of(), navigate: vi.fn() };
  const attributesPage = {
    data: [
      {
        id: 7,
        name: 'Color',
        values: [
          { id: 70, value: 'Rojo' },
          { id: 71, value: 'Azul' },
        ],
      },
      {
        id: 8,
        name: 'Tamaño',
        values: [{ id: 80, value: 'Grande' }],
      },
    ],
    total: 2,
    page: 1,
    limit: 100,
    lastPage: 1,
  };
  const product = {
    id: 5,
    stock: 10,
    price: 25,
    baseProductId: 3,
    baseProductName: 'Tornillo',
    productAttributes: [
      {
        attributeId: 8,
        attributeName: 'Tamaño',
        attributeValueId: 80,
        attributeValue: 'Grande',
        order: 20,
      },
      {
        attributeId: 7,
        attributeName: 'Color',
        attributeValueId: 70,
        attributeValue: 'Rojo',
        order: 10,
      },
    ],
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    attributesService.findAllWithValues.mockReturnValue(of(attributesPage));
    productsService.findOne.mockReturnValue(of(product));
    productsService.update.mockReturnValue(of(product));

    await TestBed.configureTestingModule({
      imports: [EditProductPage],
      providers: [
        { provide: AttributesService, useValue: attributesService },
        { provide: ProductsService, useValue: productsService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '5' }, pathFromRoot: [] } },
        },
      ],
    }).compileComponents();
  });

  async function createPage() {
    const fixture = TestBed.createComponent(EditProductPage);
    await fixture.whenStable();
    return fixture.componentInstance as any;
  }

  it('loads attributes ordered by the API order and sends a complete update', async () => {
    const page = await createPage();
    page.attributeRows.at(0).patchValue({ attributeValueId: 71, order: 30 });

    await page.onSubmit();

    expect(productsService.update).toHaveBeenCalledWith(5, {
      productAttributes: [
        { attributeId: 7, attributeValueId: 71, order: 30 },
        { attributeId: 8, attributeValueId: 80, order: 20 },
      ],
    });
    expect(router.navigate).toHaveBeenCalledWith(['/mantenimiento/productos']);
  });

  it('sends an empty attribute replacement when all attributes are removed', async () => {
    const page = await createPage();
    page.attributeRows.clear();

    await page.onSubmit();

    expect(productsService.update).toHaveBeenCalledWith(5, { productAttributes: [] });
  });

  it('does not call the API when there are no changes', async () => {
    const page = await createPage();

    await page.onSubmit();

    expect(productsService.update).not.toHaveBeenCalled();
  });
});
