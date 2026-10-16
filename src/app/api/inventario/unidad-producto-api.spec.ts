import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { UnidadProductoApi } from './unidad-producto-api';

describe('UnidadProductoApi', () => {
  let api: UnidadProductoApi;
  let http: HttpTestingController;
  const base = 'http://localhost:3000/api/productos/p1/unidades';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
      ],
    });
    api = TestBed.inject(UnidadProductoApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('lista asociaciones del producto', async () => {
    const response = api.list('p1');
    const request = http.expectOne(base);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'as1', unidadId: 'u2', factorABase: '12.00000000' }]);
    expect((await response)[0].factorABase).toBe('12.00000000');
  });

  it('envía el factor como texto al crear y editar; elimina por id de asociación', async () => {
    const dto = { unidadId: 'u2', factorABase: '12.50000000' };
    const created = api.create('p1', dto);
    const post = http.expectOne(base);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual(dto);
    post.flush({ id: 'as1', productoId: 'p1', ...dto });
    expect((await created).id).toBe('as1');

    const edited = api.update('p1', 'as1', { factorABase: '24.5' });
    const patch = http.expectOne(`${base}/as1`);
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body).toEqual({ factorABase: '24.5' });
    patch.flush({ id: 'as1', productoId: 'p1', unidadId: 'u2', factorABase: '24.5' });
    expect((await edited).factorABase).toBe('24.5');

    const removed = api.remove('p1', 'as1');
    const deletion = http.expectOne(`${base}/as1`);
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
    await removed;
  });
});
