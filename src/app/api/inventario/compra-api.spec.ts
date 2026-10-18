import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CompraApi } from './compra-api';

describe('CompraApi (lectura)', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('envía paginación y búsqueda documental o por proveedor', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.list(2, 10, 'F001 123');
    const request = http.expectOne(
      'http://localhost:3000/api/compras?page=2&limit=10&q=F001%20123',
    );
    expect(request.request.method).toBe('GET');
    const response = { data: [], meta: { page: 2, limit: 10, total: 0, totalPages: 0 } };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('no envía una búsqueda vacía y obtiene el detalle por ID', async () => {
    const api = TestBed.inject(CompraApi);
    const http = TestBed.inject(HttpTestingController);
    const list = api.list(1, 20, '');
    http
      .expectOne('http://localhost:3000/api/compras?page=1&limit=20')
      .flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await list;

    const detail = api.getById('compra-1');
    const request = http.expectOne('http://localhost:3000/api/compras/compra-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'compra-1', comprobante: null, renglones: [] });
    expect((await detail).id).toBe('compra-1');
  });
});
