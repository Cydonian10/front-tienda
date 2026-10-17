import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AtributoApi } from './atributo-api';

describe('AtributoApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.resetTestingModule());

  it('consulta el listado paginado y los totales de uso', async () => {
    const api = TestBed.inject(AtributoApi);
    const http = TestBed.inject(HttpTestingController);
    const response = {
      data: [{ id: 'a1', nombre: 'Color', usoProductos: 2 }],
      meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
      totalRegistrados: 15,
      totalEnUso: 3,
    };
    const result = api.list(2, 10, 'Color');
    const request = http.expectOne((req) => req.url === 'http://localhost:3000/api/atributos');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('nombre')).toBe('Color');
    request.flush(response);
    await expect(result).resolves.toEqual(response);
    http.verify();
  });

  it('crea, renombra y elimina atributos', async () => {
    const api = TestBed.inject(AtributoApi);
    const http = TestBed.inject(HttpTestingController);
    const created = api.create({ nombre: 'Material' });
    const post = http.expectOne('http://localhost:3000/api/atributos');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nombre: 'Material' });
    post.flush({ id: 'a2', nombre: 'Material' });
    await created;

    const updated = api.update('a2', { nombre: 'Composición' });
    const patch = http.expectOne('http://localhost:3000/api/atributos/a2');
    expect(patch.request.method).toBe('PATCH');
    patch.flush({ id: 'a2', nombre: 'Composición' });
    await updated;

    const removed = api.remove('a2');
    const deletion = http.expectOne('http://localhost:3000/api/atributos/a2');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
    await removed;
    http.verify();
  });
});
