import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { PaymentMethodsService } from './payment-methods.service';

describe('PaymentMethodsService', () => {
  let service: PaymentMethodsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentMethodsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PaymentMethodsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads active payment methods', async () => {
    const request = firstValueFrom(service.findActive());
    const httpRequest = httpTesting.expectOne(`${environment.apiUrl}/payment-methods`);

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ data: [{ id: 1, name: 'Efectivo', active: true }], message: 'OK' });

    await expect(request).resolves.toEqual([{ id: 1, name: 'Efectivo', active: true }]);
  });
});
