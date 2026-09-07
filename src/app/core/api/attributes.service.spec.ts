import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { AttributesService } from './attributes.service';

describe('AttributesService', () => {
  let service: AttributesService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttributesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AttributesService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  it('loads attributes with the active pagination and search filter', async () => {
    const request = firstValueFrom(service.findAllWithValues({ page: 2, limit: 25, search: 'color' }));

    const testRequest = httpTesting.expectOne(
      `${environment.apiUrl}/attributes/batch?page=2&limit=25&search=color`,
    );
    expect(testRequest.request.method).toBe('GET');
    testRequest.flush({ data: [], total: 0, page: 2, limit: 25, lastPage: 0 });

    await expect(request).resolves.toEqual({
      data: [],
      total: 0,
      page: 2,
      limit: 25,
      lastPage: 0,
    });
  });

  it('sends the batch payload and marks a 201 response as created', async () => {
    const dto = { name: 'Color', values: [{ value: 'Rojo' }] };
    const request = firstValueFrom(service.createWithValues(dto));

    const testRequest = httpTesting.expectOne(`${environment.apiUrl}/attributes/batch`);
    expect(testRequest.request.method).toBe('POST');
    expect(testRequest.request.body).toEqual(dto);
    testRequest.flush(
      { data: { id: 1, name: 'Color', values: [{ id: 2, value: 'Rojo', attributeId: 1 }] } },
      { status: 201, statusText: 'Created' },
    );

    await expect(request).resolves.toEqual({
      attribute: {
        id: 1,
        name: 'Color',
        values: [{ id: 2, value: 'Rojo', attributeId: 1 }],
      },
      created: true,
    });
  });

  it('marks a 200 batch response as an existing attribute', async () => {
    const request = firstValueFrom(
      service.createWithValues({ name: 'Color', values: [{ value: 'Azul' }] }),
    );

    const testRequest = httpTesting.expectOne(`${environment.apiUrl}/attributes/batch`);
    testRequest.flush(
      { data: { id: 1, name: 'Color', values: [{ id: 3, value: 'Azul', attributeId: 1 }] } },
      { status: 200, statusText: 'OK' },
    );

    await expect(request).resolves.toMatchObject({ created: false, attribute: { id: 1 } });
  });
});
