import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { PeopleService } from './people.service';

describe('PeopleService', () => {
  let service: PeopleService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PeopleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PeopleService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads eligible cash responsibles', async () => {
    const request = firstValueFrom(service.findCashResponsibles());
    const httpRequest = httpTesting.expectOne(`${environment.apiUrl}/people/cash-responsibles`);

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({
      data: [{ id: 1, firstName: 'Ana', lastName: 'Pérez' }],
      message: 'OK',
    });

    await expect(request).resolves.toEqual([{ id: 1, firstName: 'Ana', lastName: 'Pérez' }]);
  });

  it('loads people with pagination filters', async () => {
    const request = firstValueFrom(service.findAll({ page: 2, limit: 20, hasAuth: false }));
    const httpRequest = httpTesting.expectOne(
      (request) =>
        request.url === `${environment.apiUrl}/people` &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '20' &&
        request.params.get('hasAuth') === 'false',
    );

    expect(httpRequest.request.method).toBe('GET');
    httpRequest.flush({ data: [], total: 0, page: 2, limit: 20, lastPage: 0 });

    await expect(request).resolves.toMatchObject({ page: 2, limit: 20, data: [] });
  });
});
