import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { CashRegisterOpeningsService } from './cash-register-openings.service';

describe('CashRegisterOpeningsService', () => {
  let service: CashRegisterOpeningsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CashRegisterOpeningsService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CashRegisterOpeningsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('sends monthly history filters', async () => {
    const request = firstValueFrom(
      service.findAll({ cashRegisterId: 3, year: 2026, month: 9 }),
    );
    const httpRequest = httpTesting.expectOne(
      `${environment.apiUrl}/cash-register-openings?cashRegisterId=3&year=2026&month=9`,
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ data: [], message: 'OK' });
    await expect(request).resolves.toEqual([]);
  });

  it('sends the opening payload', async () => {
    const request = firstValueFrom(
      service.create({ cashRegisterId: 3, openingAmount: 50, responsibleId: 8 }),
    );
    const httpRequest = httpTesting.expectOne(
      `${environment.apiUrl}/cash-register-openings`,
    );

    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual({
      cashRegisterId: 3,
      openingAmount: 50,
      responsibleId: 8,
    });
    httpRequest.flush({ data: { id: 1 }, message: 'Creada' }, { status: 201, statusText: 'Created' });

    await expect(request).resolves.toEqual({ id: 1 });
  });
});
