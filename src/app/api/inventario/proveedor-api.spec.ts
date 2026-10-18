import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProveedorApi } from './proveedor-api';

describe('ProveedorApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('envía página, límite y filtros de proveedor', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.list(2, 15, 'Acero Norte', '204');
    const request = http.expectOne(
      'http://localhost:3000/api/proveedores?page=2&limit=15&nombre=Acero%20Norte&documento=204',
    );
    expect(request.request.method).toBe('GET');
    const response = { data: [], meta: { page: 2, limit: 15, total: 0, totalPages: 0 } };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('omite filtros vacíos y consulta la búsqueda sin paginar', async () => {
    const api = TestBed.inject(ProveedorApi);
    const http = TestBed.inject(HttpTestingController);
    const page = api.list(1, 20, '', '');
    http
      .expectOne('http://localhost:3000/api/proveedores?page=1&limit=20')
      .flush({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    await page;

    const all = api.listAll('Ferretería');
    const request = http.expectOne(
      'http://localhost:3000/api/proveedores/todos?nombre=Ferreter%C3%ADa',
    );
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'p1', nombre: 'Ferretería', documento: null, contacto: null }]);
    expect((await all)[0].id).toBe('p1');
  });
});
