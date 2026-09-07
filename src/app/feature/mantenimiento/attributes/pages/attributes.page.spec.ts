import { TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AttributesService } from '../../../../core/api/attributes.service';
import { AttributeWithValues } from '../../../../core/models/attribute.model';
import AttributesPage from './attributes.page';

describe('AttributesPage', () => {
  const color: AttributeWithValues = {
    id: 1,
    name: 'Color',
    values: [{ id: 2, value: 'Rojo', attributeId: 1 }],
  };
  const attributesService = { findAllWithValues: vi.fn() };
  const dialog = { open: vi.fn() };
  const router = { events: of() };

  beforeEach(async () => {
    vi.clearAllMocks();
    attributesService.findAllWithValues.mockReturnValue(
      of({ data: [color], total: 1, page: 1, limit: 10, lastPage: 1 }),
    );

    await TestBed.configureTestingModule({
      imports: [AttributesPage],
      providers: [
        { provide: AttributesService, useValue: attributesService },
        { provide: Dialog, useValue: dialog },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [] } } },
      ],
    }).compileComponents();
  });

  async function createPage() {
    const fixture = TestBed.createComponent(AttributesPage);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 120));
    fixture.detectChanges();
    return { fixture, page: fixture.componentInstance as any };
  }

  it('loads the first page with the default page size', async () => {
    await createPage();

    expect(attributesService.findAllWithValues).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it('resets pagination when searching', async () => {
    const { page } = await createPage();
    page.page.set(2);

    page.onSearch('Color');

    expect(page.page()).toBe(1);
  });

  it('inserts a newly created matching attribute without exceeding the page size', async () => {
    const { page } = await createPage();
    page.pageSize.set(1);
    page.attributes.set({ data: [color], total: 1, page: 1, limit: 1, lastPage: 1 });
    const sizeResult = {
      attribute: {
        id: 3,
        name: 'Talla',
        values: [{ id: 4, value: 'M', attributeId: 3 }],
      },
      created: true,
    };

    page.updateAttributes(sizeResult);

    expect(page.attributes().data).toEqual([sizeResult.attribute]);
    expect(page.attributes().total).toBe(2);
    expect(page.attributes().lastPage).toBe(2);
  });

  it('replaces a visible existing attribute without changing the total', async () => {
    const { page } = await createPage();
    page.updateAttributes({
      created: false,
      attribute: { ...color, values: [...color.values, { id: 3, value: 'Azul', attributeId: 1 }] },
    });

    expect(page.attributes().data[0].values).toHaveLength(2);
    expect(page.attributes().total).toBe(1);
  });

  it('opens the values dialog from a table action', async () => {
    const { page } = await createPage();

    page.onShowValues(color);

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: color }),
    );
  });
});
