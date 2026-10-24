import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { CategoriaApi } from './categoria-api';

describe('CategoriaApi', () => {
  const base = 'http://localhost:3000/api/categorias';
  const categoria = { id: 'c1', nombre: 'Herramientas', descripcion: null, activo: true };
  let api: CategoriaApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
    ] });
    api = TestBed.inject(CategoriaApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); TestBed.resetTestingModule(); });

  it('pagina y combina búsqueda y estado sin enviar filtros ausentes', async () => {
    const result = api.list({ q: 'herr', activo: true, page: 3, limit: 20 });
    const request = http.expectOne((req) => req.url === base);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['activo', 'limit', 'page', 'q']);
    expect(request.request.params.get('activo')).toBe('true');
    expect(request.request.params.get('q')).toBe('herr');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('20');
    const page = { items: [categoria], page: 3, limit: 20, totalItems: 41 };
    request.flush(page);
    expect(await result).toEqual(page);

    const all = api.list({ page: 1, limit: 20 });
    const unfiltered = http.expectOne((req) => req.url === base);
    expect(unfiltered.request.params.keys().sort()).toEqual(['limit', 'page']);
    unfiltered.flush({ items: [], page: 1, limit: 20, totalItems: 0 });
    expect((await all).items).toEqual([]);
  });

  it('consulta el detalle, crea y edita una descripción nullable', async () => {
    const detail = api.getById('c1');
    const get = http.expectOne(`${base}/c1`);
    expect(get.request.method).toBe('GET');
    get.flush(categoria);
    expect(await detail).toEqual(categoria);

    const created = api.create({ nombre: 'Herramientas', descripcion: 'Manual' });
    const post = http.expectOne(base);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nombre: 'Herramientas', descripcion: 'Manual' });
    post.flush({ ...categoria, descripcion: 'Manual' });
    expect((await created).descripcion).toBe('Manual');

    const updated = api.update('c1', { descripcion: null });
    const patch = http.expectOne(`${base}/c1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ descripcion: null });
    patch.flush(categoria);
    expect((await updated).descripcion).toBeNull();
  });

  it('cambia estado por endpoint dedicado y no oculta conflictos', async () => {
    const status = api.changeStatus('c1', false);
    const request = http.expectOne(`${base}/c1/estado`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ activo: false });
    request.flush({ ...categoria, activo: false });
    expect((await status).activo).toBe(false);

    const rejected = api.create({ nombre: 'Herramientas' });
    http.expectOne(base).flush({ message: 'Nombre duplicado' }, { status: 409, statusText: 'Conflict' });
    await expect(rejected).rejects.toMatchObject({ status: 409 });
  });
});
