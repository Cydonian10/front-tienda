import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PERMISSION_CODES } from '../interfaces/access-control/permision.interface';
import { ExistenciaApi } from './existencia-api';

describe('ExistenciaApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  afterEach(() => TestBed.resetTestingModule());

  it('declara el código de permiso que protege Existencias', () => {
    expect(PERMISSION_CODES.EXISTENCIAS_READ).toBe('EXISTENCIAS_LEER');
  });

  it('consulta almacenes activos y conserva la respuesta del contrato', async () => {
    const api = TestBed.inject(ExistenciaApi);
    const http = TestBed.inject(HttpTestingController);
    const response = [{ id: 'almacen-1', nombre: 'Principal' }];

    const result = api.listarAlmacenes();
    const request = http.expectOne('http://localhost:3000/api/existencias/almacenes');

    expect(request.request.method).toBe('GET');
    request.flush(response);

    await expect(result).resolves.toEqual(response);
    http.verify();
  });

  it('envía los filtros y conserva los decimales de la respuesta como cadenas', async () => {
    const api = TestBed.inject(ExistenciaApi);
    const http = TestBed.inject(HttpTestingController);
    const response = {
      items: [
        {
          producto: {
            id: 'producto-1',
            nombre: 'Tornillo',
            activo: true,
            unidadBase: { id: 'unidad-1', nombre: 'Unidad', simbolo: 'u' },
          },
          variante: {
            id: 'variante-1',
            sku: 'TOR-M8',
            activo: true,
            precioVenta: '19.90',
            valores: [{ atributoId: 'atributo-1', atributo: 'Medida', valor: 'M8' }],
          },
          almacen: { id: 'almacen-1', nombre: 'Principal' },
          cantidadBase: '25.000000',
          valorCosto: '120.000000',
          costoPromedioBase: '4.800000',
          costoRegistradoCero: false,
          unidadesSecundarias: [
            {
              id: 'unidad-caja',
              nombre: 'Caja',
              simbolo: 'cja',
              factorABase: '12.00000000',
            },
          ],
        },
      ],
      page: 2,
      limit: 20,
      totalItems: 31,
      totalValorCosto: '987.650000',
    };

    const result = api.listar({
      almacenId: 'todos',
      page: 2,
      limit: 20,
      q: 'tornillo M8',
      productoId: 'producto-1',
      disponibilidad: 'con_stock',
    });
    const request = http.expectOne((req) => req.url === 'http://localhost:3000/api/existencias');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([
      'almacenId',
      'page',
      'limit',
      'q',
      'productoId',
      'disponibilidad',
    ]);
    expect(request.request.params.get('almacenId')).toBe('todos');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('q')).toBe('tornillo M8');
    expect(request.request.params.get('productoId')).toBe('producto-1');
    expect(request.request.params.get('disponibilidad')).toBe('con_stock');
    request.flush(response);

    await expect(result).resolves.toEqual(response);
    await expect(result).resolves.toMatchObject({
      items: [
        {
          cantidadBase: '25.000000',
          valorCosto: '120.000000',
          costoPromedioBase: '4.800000',
          variante: { precioVenta: '19.90' },
          unidadesSecundarias: [{ factorABase: '12.00000000' }],
        },
      ],
      totalValorCosto: '987.650000',
    });
    http.verify();
  });
});
