import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImagesService } from '../../../../../core/api/images.service';
import ProductImagesPage from './product-images.page';

describe('ProductImagesPage', () => {
  const imagesService = {
    findAll: vi.fn(),
    remove: vi.fn(),
    setMain: vi.fn(),
    upload: vi.fn(),
  };
  const router = { events: of(), navigate: vi.fn() };
  const dialog = { open: vi.fn() };
  const images = [
    {
      id: 2,
      url: '/uploads/second.webp',
      entityType: 'product',
      entityId: 5,
      isMain: false,
    },
    {
      id: 1,
      url: '/uploads/main.webp',
      entityType: 'product',
      entityId: 5,
      isMain: true,
    },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    imagesService.findAll.mockReturnValue(of(images));

    await TestBed.configureTestingModule({
      imports: [ProductImagesPage],
      providers: [
        { provide: ImagesService, useValue: imagesService },
        { provide: Dialog, useValue: dialog },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '5' }, pathFromRoot: [] } },
        },
      ],
    }).compileComponents();
  });

  async function createPage(): Promise<{
    fixture: ComponentFixture<ProductImagesPage>;
    page: any;
  }> {
    const fixture = TestBed.createComponent(ProductImagesPage);
    await fixture.whenStable();
    return { fixture, page: fixture.componentInstance as any };
  }

  it('loads persisted product images and resolves their API URLs', async () => {
    const { fixture, page } = await createPage();

    expect(imagesService.findAll).toHaveBeenCalledWith('product', 5);
    expect(page.uploads()).toHaveLength(2);
    expect(page.uploads()[1]).toMatchObject({
      id: -1,
      previewUrl: 'http://localhost:3000/uploads/main.webp',
      status: 'success',
      image: images[1],
    });

    fixture.destroy();
  });
});
