import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { UnidadApi } from './unidad-api';

describe('UnidadApi', () => {
  let api: UnidadApi;
  let http: HttpTestingController;
  const url = 'http://localhost:3000/api/unidades';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
      ],
    });
    api = TestBed.inject(UnidadApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista unidades con paginación y filtro por nombre', async () => {
    const result = api.list(2, 5, 'Caja');
    const request = http.expectOne((req) => req.url === url);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('5');
    expect(request.request.params.get('nombre')).toBe('Caja');
    request.flush({
      data: [{ id: 'u1', nombre: 'Caja', simbolo: 'cja', tipo: 'empaque' }],
      meta: { page: 2, limit: 20, total: 21, totalPages: 2 },
    });
    expect((await result).data[0].tipo).toBe('empaque');
  });

  it('crea una unidad con nombre, símbolo y tipo', async () => {
    const dto = { nombre: 'Docena', simbolo: 'doc', tipo: 'conteo' };
    const result = api.create(dto);
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    request.flush({ id: 'u2', ...dto });
    expect((await result).id).toBe('u2');
  });

  it('actualiza y elimina por identificador', async () => {
    const updated = api.update('u2', { simbolo: 'doc' });
    const patch = http.expectOne(`${url}/u2`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ simbolo: 'doc' });
    patch.flush({ id: 'u2', nombre: 'Docena', simbolo: 'doc', tipo: 'conteo' });
    expect((await updated).simbolo).toBe('doc');

    const deleted = api.remove('u2');
    const deletion = http.expectOne(`${url}/u2`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
    await deleted;
  });
});
