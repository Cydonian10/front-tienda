import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { CashMovementsService } from './cash-movements.service';

describe('CashMovementsService', () => {
  let service: CashMovementsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CashMovementsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CashMovementsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('sends movement filters without wrapping the paginated response', async () => {
    const result = firstValueFrom(
      service.findAll({ cashOpeningId: 3, type: 'expense', page: 2, limit: 20 }),
    );
    const request = httpTesting.expectOne(
      `${environment.apiUrl}/cash-movements?cashOpeningId=3&type=expense&page=2&limit=20`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: [], total: 0, page: 2, limit: 20, lastPage: 0 });
    await expect(result).resolves.toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 20,
      lastPage: 0,
    });
  });

  it('sends positive movement payloads', async () => {
    const result = firstValueFrom(
      service.create({ cashOpeningId: 3, type: 'income', amount: 20, reason: 'Cambio' }),
    );
    const request = httpTesting.expectOne(`${environment.apiUrl}/cash-movements`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      cashOpeningId: 3,
      type: 'income',
      amount: 20,
      reason: 'Cambio',
    });
    request.flush({ data: { id: 1 }, message: 'Creado' }, { status: 201, statusText: 'Created' });
    await expect(result).resolves.toEqual({ id: 1 });
  });
});
