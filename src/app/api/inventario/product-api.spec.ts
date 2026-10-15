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
});
