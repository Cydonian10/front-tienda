import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AlmacenApi } from './almacen-api';

describe('AlmacenApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.resetTestingModule());

  it('envía paginación, nombre y estado al backend sin convertir false en ausencia de filtro', async () => {
    const api = TestBed.inject(AlmacenApi);
    const http = TestBed.inject(HttpTestingController);
    const response = {
      data: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
      totalRegistrados: 4,
      totalActivos: 3,
      totalInactivos: 1,
    };
    const result = api.list(2, 10, 'Depósito', false);
    const request = http.expectOne(
      'http://localhost:3000/api/almacenes?page=2&limit=10&nombre=Dep%C3%B3sito&activo=false',
    );
    expect(request.request.method).toBe('GET');
    request.flush(response);
    await expect(result).resolves.toEqual(response);
    http.verify();
  });

  it('crea y actualiza el estado sin eliminar el almacén', async () => {
    const api = TestBed.inject(AlmacenApi);
    const http = TestBed.inject(HttpTestingController);
    const created = api.create({ nombre: 'Principal', activo: true });
    const post = http.expectOne('http://localhost:3000/api/almacenes');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nombre: 'Principal', activo: true });
    post.flush({ id: 'a1', nombre: 'Principal', activo: true });
    await created;
    const updated = api.update('a1', { activo: false });
    const patch = http.expectOne('http://localhost:3000/api/almacenes/a1');
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ activo: false });
    patch.flush({ id: 'a1', nombre: 'Principal', activo: false });
    await updated;
    http.verify();
  });
});
