import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ENVIRONMENT } from '../config/env-dev';
import { ProductoApi } from './product-api';

describe('ProductoApi', () => {
  let api: ProductoApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ENVIRONMENT, useValue: { apiUrl: 'http://localhost:3000/api' } },
      ],
    });
    api = TestBed.inject(ProductoApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta y asocia atributos del producto', async () => {
    const attrs = api.listAttributes('producto-1');
    http
      .expectOne('http://localhost:3000/api/productos/producto-1/atributos')
      .flush([{ atributoId: 'a1', atributo: 'Color', productoId: 'producto-1' }]);
    expect((await attrs)[0].atributo).toBe('Color');

    const add = api.addAttribute('producto-1', 'a1');
    const request = http.expectOne('http://localhost:3000/api/productos/producto-1/atributos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ atributoId: 'a1' });
    request.flush({});
    await add;

    const remove = api.removeAttribute('producto-1', 'a1');
    const deletion = http.expectOne('http://localhost:3000/api/productos/producto-1/atributos/a1');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush(null);
    await remove;
  });

  it('carga las unidades para seleccionar un ID real', async () => {
    const result = api.listUnidades();
    const request = http.expectOne('http://localhost:3000/api/unidades?limit=100');
    expect(request.request.method).toBe('GET');
    request.flush({ data: [{ id: 'unidad-1', nombre: 'Unidad', simbolo: 'u' }] });
    expect(await result).toEqual([{ id: 'unidad-1', nombre: 'Unidad', simbolo: 'u' }]);
  });

  it('crea el producto con multipart/form-data', async () => {
    const portada = new File(['imagen 1'], 'portada.png', { type: 'image/png' });
    const otra = new File(['imagen 2'], 'otra.jpg', { type: 'image/jpeg' });
    const result = api.create({
      nombre: 'Martillo',
      descripcion: 'Acero',
      unidadBaseId: 'unidad-1',
      activo: true,
      imagenes: [portada, otra],
    });
    const request = http.expectOne('http://localhost:3000/api/productos');
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body.get('nombre')).toBe('Martillo');
    expect(body.get('unidadBaseId')).toBe('unidad-1');
    expect(body.get('activo')).toBe('true');
    expect(body.getAll('imagenes')).toEqual([portada, otra]);
    request.flush({ id: 'producto-1' });
    expect(await result).toEqual({ id: 'producto-1' });
  });

  it('recupera un producto por ID', async () => {
    const result = api.getById('producto-1');
    const request = http.expectOne('http://localhost:3000/api/productos/producto-1');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'producto-1', nombre: 'Martillo', imagenes: [], puedeCambiarUnidadBase: false });
    expect((await result).puedeCambiarUnidadBase).toBe(false);
  });

  it('busca por nombre y página con los parámetros de SPEC 05', async () => {
    const result = api.search({ q: 'martillo', page: 2, limit: 20 });
    const request = http.expectOne((req) => req.url === 'http://localhost:3000/api/productos');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['limit', 'page', 'q']);
    expect(request.request.params.get('q')).toBe('martillo');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    const page = {
      items: [{ id: 'producto-1', nombre: 'Martillo', activo: false }],
      page: 2,
      limit: 20,
      totalItems: 21,
    };
    request.flush(page);
    expect(await result).toEqual(page);
  });

  it('propaga el error de búsqueda sin devolver resultados simulados', async () => {
    const result = api.search({ q: 'martillo', page: 1, limit: 20 });
    http.expectOne((req) => req.url === 'http://localhost:3000/api/productos').flush(
      { message: 'No autorizado' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expect(result).rejects.toMatchObject({ status: 403, error: { message: 'No autorizado' } });
  });

  it('actualiza datos generales sin reenviar imágenes', async () => {
    const dto = {
      nombre: 'Martillo nuevo',
      descripcion: '',
      unidadBaseId: 'unidad-1',
      activo: false,
    };
    const result = api.update('producto-1', dto);
    const request = http.expectOne('http://localhost:3000/api/productos/producto-1');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(dto);
    request.flush({ id: 'producto-1', ...dto, imagenes: [] });
    expect((await result).activo).toBe(false);
  });

  it('actualiza producto e imágenes juntos por multipart', async () => {
    const file = new File(['foto'], 'foto.png', { type: 'image/png' });
    const result = api.update('producto-1', {
      nombre: 'Martillo',
      descripcion: '',
      unidadBaseId: 'unidad-1',
      activo: true,
      imagenesConservarIds: [],
      imagenes: [file],
    });
    const request = http.expectOne('http://localhost:3000/api/productos/producto-1');
    expect(request.request.method).toBe('PATCH');
    const body = request.request.body as FormData;
    expect(body.get('imagenesConservarIds')).toBe('[]');
    expect(body.getAll('imagenes')).toEqual([file]);
    expect(body.get('activo')).toBe('true');
    request.flush({ id: 'producto-1', imagenes: [] });
    expect((await result).id).toBe('producto-1');
  });

  it('descarga una imagen usando el ID de imagen, no el de asociación', async () => {
    const result = api.getImage('producto-1', 'imagen-1');
    const request = http.expectOne(
      'http://localhost:3000/api/productos/producto-1/imagenes/imagen-1/archivo',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    const blob = new Blob(['foto'], { type: 'image/png' });
    request.flush(blob);
    expect(await result).toBe(blob);
  });
});
