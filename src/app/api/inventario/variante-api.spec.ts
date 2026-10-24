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

  it('actualiza campos de variante por JSON sin enviar fotos', async () => {
    const result = api.update('p1', 'v1', {
      precio: '23.50', codigoBarras: null, activo: false,
      valores: [{ atributoId: 'a1', valor: 'Azul' }],
    });
    const request = http.expectOne(`${url}/productos/p1/variantes/v1`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      precio: '23.50', codigoBarras: null, activo: false,
      valores: [{ atributoId: 'a1', valor: 'Azul' }],
    });
    request.flush({ id: 'v1', precio: '23.50', codigoBarras: null, activo: false });
    expect((await result).precio).toBe('23.50');
  });

  it('actualiza fotos y campos juntos en multipart conservando solo asociaciones propias', async () => {
    const image = new File(['foto'], 'nueva.png', { type: 'image/png' });
    const result = api.update('p1', 'v1', {
      precio: '25.00',
      codigoBarras: null,
      activo: false,
      valores: [{ atributoId: 'a1', valor: 'Azul' }],
      imagenesConservarIds: ['asociacion-propia'],
      imagenes: [image],
    });
    const request = http.expectOne(`${url}/productos/p1/variantes/v1`);
    expect(request.request.method).toBe('PATCH');
    const body = request.request.body as FormData;
    expect(body.get('precio')).toBe('25.00');
    expect(body.get('codigoBarras')).toBe('');
    expect(body.get('activo')).toBe('false');
    expect(body.get('valores')).toBe('[{"atributoId":"a1","valor":"Azul"}]');
    expect(body.get('imagenesConservarIds')).toBe('["asociacion-propia"]');
    expect(body.getAll('imagenes')).toEqual([image]);
    request.flush({ id: 'v1' });
    expect((await result).id).toBe('v1');
  });

  it('permite quitar todas las fotos propias sin subir nuevas', async () => {
    const result = api.update('p1', 'v1', { imagenesConservarIds: [] });
    const request = http.expectOne(`${url}/productos/p1/variantes/v1`);
    expect(request.request.body).toBeInstanceOf(FormData);
    expect((request.request.body as FormData).get('imagenesConservarIds')).toBe('[]');
    request.flush({ id: 'v1', imagenes: [] });
    await result;
  });

  it('lee la galería efectiva con su origen y el archivo de una imagen heredada', async () => {
    const images = api.listImages('p1', 'v1');
    const list = http.expectOne(`${url}/productos/p1/variantes/v1/imagenes`);
    expect(list.request.method).toBe('GET');
    list.flush([{ id: 'as1', imagenId: 'i1', origen: 'producto', orden: 0, esPrincipal: true }]);
    expect((await images)[0].origen).toBe('producto');

    const file = api.getImage('p1', 'v1', 'i1');
    const download = http.expectOne(`${url}/productos/p1/variantes/v1/imagenes/i1/archivo`);
    expect(download.request.method).toBe('GET');
    expect(download.request.responseType).toBe('blob');
    const blob = new Blob(['foto'], { type: 'image/png' });
    download.flush(blob);
    expect(await file).toBe(blob);
  });

  it('propaga errores de actualización sin confirmar datos', async () => {
    const result = api.update('p1', 'v1', { precio: '12.00' });
    http.expectOne(`${url}/productos/p1/variantes/v1`).flush(
      { message: 'Precio inválido' },
      { status: 400, statusText: 'Bad Request' },
    );
    await expect(result).rejects.toMatchObject({ status: 400, error: { message: 'Precio inválido' } });
  });
});
