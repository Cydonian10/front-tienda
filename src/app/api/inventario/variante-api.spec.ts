import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { VarianteApi } from './variante-api';

describe('VarianteApi', () => {
  let api: VarianteApi;
  let http: HttpTestingController;
  const url = 'http://localhost:3000/api';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: url } },
      ],
    });
    api = TestBed.inject(VarianteApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta variantes guardadas', async () => {
    const variants = api.list('p1');
    http.expectOne(`${url}/productos/p1/variantes`).flush([{ id: 'v1', sku: 'SKU-1' }]);
    expect((await variants)[0].id).toBe('v1');
  });

  it('crea variantes con valores serializados e imágenes en multipart', async () => {
    const image = new File(['foto'], 'foto.png', { type: 'image/png' });
    const result = api.create('p1', {
      precio: '19.90',
      valores: [{ atributoId: 'a1', valor: 'Negro' }],
      imagenes: [image],
    });
    const request = http.expectOne(`${url}/productos/p1/variantes`);
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('precio')).toBe('19.90');
    expect(body.get('valores')).toBe('[{"atributoId":"a1","valor":"Negro"}]');
    expect(body.getAll('imagenes')).toEqual([image]);
    expect(body.has('sku')).toBe(false);
    request.flush({ id: 'v1' });
    expect((await result).id).toBe('v1');
  });
});
