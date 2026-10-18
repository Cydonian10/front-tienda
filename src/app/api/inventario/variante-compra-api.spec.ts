import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { VarianteCompraApi } from './variante-compra-api';

describe('VarianteCompraApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('busca variantes paginadas por nombre o SKU', async () => {
    const api = TestBed.inject(VarianteCompraApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.list(3, 10, 'SKU-001');
    const request = http.expectOne('http://localhost:3000/api/variantes?page=3&limit=10&q=SKU-001');
    expect(request.request.method).toBe('GET');
    const response = { data: [], meta: { page: 3, limit: 10, total: 0, totalPages: 0 } };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('no envía una búsqueda vacía', async () => {
    const result = TestBed.inject(VarianteCompraApi).list(1, 20, '');
    TestBed.inject(HttpTestingController)
      .expectOne('http://localhost:3000/api/variantes?page=1&limit=20')
      .flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await result;
  });
});
