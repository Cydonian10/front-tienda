import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { SalesService } from './sales.service';

describe('SalesService', () => {
  let service: SalesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SalesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SalesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('sends sale filters as query parameters', async () => {
    const request = firstValueFrom(
      service.findAll({ page: 2, limit: 20, status: 'PENDING', cashOpeningId: 4 }),
    );
    const httpRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/sales` &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '20' &&
        request.params.get('status') === 'PENDING' &&
        request.params.get('cashOpeningId') === '4',
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ data: [], total: 0, page: 2, limit: 20, lastPage: 0 });

    await expect(request).resolves.toMatchObject({ page: 2, limit: 20, data: [] });
  });

  it('sends creation, update, payment, and cancellation payloads', async () => {
    const create = firstValueFrom(
      service.create({ cashOpeningId: 4, customerId: 3, details: [{ productId: 1, quantity: 2 }] }),
    );
    const createRequest = httpTesting.expectOne(`${environment.apiUrl}/sales`);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush({ data: { id: 1 }, message: 'OK' });

    const update = firstValueFrom(service.update(1, { discount: 2 }));
    const updateRequest = httpTesting.expectOne(`${environment.apiUrl}/sales/1`);
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ discount: 2 });
    updateRequest.flush({ data: { id: 1 }, message: 'OK' });

    const pay = firstValueFrom(service.pay(1, { paymentMethodId: 1, amount: 10 }));
    const payRequest = httpTesting.expectOne(`${environment.apiUrl}/sales/1/pay`);
    expect(payRequest.request.method).toBe('POST');
    payRequest.flush({ data: { id: 1, status: 'PAID' }, message: 'OK' });

    const cancel = firstValueFrom(
      service.cancel(1, { cancellationReason: 'Cliente desistió de la compra' }),
    );
    const cancelRequest = httpTesting.expectOne(`${environment.apiUrl}/sales/1/cancel`);
    expect(cancelRequest.request.method).toBe('POST');
    cancelRequest.flush({ data: { id: 1, status: 'CANCELLED' }, message: 'OK' });

    await expect(create).resolves.toMatchObject({ id: 1 });
    await expect(update).resolves.toMatchObject({ id: 1 });
    await expect(pay).resolves.toMatchObject({ status: 'PAID' });
    await expect(cancel).resolves.toMatchObject({ status: 'CANCELLED' });
  });
});
