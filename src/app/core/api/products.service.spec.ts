import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads a product by id', async () => {
    const request = firstValueFrom(service.findOne(5));

    const testRequest = httpTesting.expectOne(`${environment.apiUrl}/products/5`);
    expect(testRequest.request.method).toBe('GET');
    testRequest.flush({ data: { id: 5 }, message: 'OK' });

    await expect(request).resolves.toEqual({ id: 5 });
  });

  it('sends the complete product update payload', async () => {
    const dto = {
      stock: 12,
      productAttributes: [
        { attributeId: 7, attributeValueId: 71, order: 20 },
      ],
    };
    const request = firstValueFrom(service.update(5, dto));

    const testRequest = httpTesting.expectOne(`${environment.apiUrl}/products/5`);
    expect(testRequest.request.method).toBe('PATCH');
    expect(testRequest.request.body).toEqual(dto);
    testRequest.flush({ data: { id: 5, ...dto }, message: 'OK' });

    await expect(request).resolves.toEqual({ id: 5, ...dto });
  });
});
