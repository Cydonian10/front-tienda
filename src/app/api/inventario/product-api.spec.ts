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
    request.flush({ id: 'producto-1', nombre: 'Martillo', imagenes: [] });
    expect((await result).nombre).toBe('Martillo');
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
