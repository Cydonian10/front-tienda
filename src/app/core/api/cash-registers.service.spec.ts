import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { CashRegistersService } from './cash-registers.service';

describe('CashRegistersService', () => {
  let service: CashRegistersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CashRegistersService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CashRegistersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads visible cash registers', async () => {
    const request = firstValueFrom(service.findAll());
    const httpRequest = httpTesting.expectOne(
      `${environment.apiUrl}/cash-registers`,
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ data: [], message: 'OK' });

    await expect(request).resolves.toEqual([]);
  });

  it('sends create and update payloads', async () => {
    const create = firstValueFrom(
      service.create({ code: 'CAJA-01', name: 'Principal' }),
    );
    const createRequest = httpTesting.expectOne(
      `${environment.apiUrl}/cash-registers`,
    );
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      code: 'CAJA-01',
      name: 'Principal',
    });
    createRequest.flush({
      data: { id: 1, code: 'CAJA-01', name: 'Principal', active: true },
      message: 'Creada',
    });

    const update = firstValueFrom(service.update(1, { active: false }));
    const updateRequest = httpTesting.expectOne(
      `${environment.apiUrl}/cash-registers/1`,
    );
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).toEqual({ active: false });
    updateRequest.flush({
      data: { id: 1, code: 'CAJA-01', name: 'Principal', active: false },
      message: 'Actualizada',
    });

    await expect(create).resolves.toMatchObject({ id: 1, active: true });
    await expect(update).resolves.toMatchObject({ id: 1, active: false });
  });
});
