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
    expect(PERMISSION_CODES.EXISTENCIAS_EDIT_MINIMUM).toBe('EXISTENCIAS_EDITAR_MINIMO');
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
          minimoBase: '12.500000',
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
      disponibilidad: 'con_stock',
    });
    const request = http.expectOne((req) => req.url === 'http://localhost:3000/api/existencias');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([
      'almacenId',
      'page',
      'limit',
      'q',
      'disponibilidad',
    ]);
    expect(request.request.params.get('almacenId')).toBe('todos');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    expect(request.request.params.get('q')).toBe('tornillo M8');
    expect(request.request.params.has('productoId')).toBe(false);
    expect(request.request.params.get('disponibilidad')).toBe('con_stock');
    request.flush(response);

    await expect(result).resolves.toEqual(response);
    await expect(result).resolves.toMatchObject({
      items: [
        {
          cantidadBase: '25.000000',
          minimoBase: '12.500000',
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

  it('consulta las alertas por almacén y mantiene saldos y mínimos exactos o nulos', async () => {
    const api = TestBed.inject(ExistenciaApi);
    const http = TestBed.inject(HttpTestingController);
    const result = api.resumenReposicion('todos');
    const request = http.expectOne('http://localhost:3000/api/existencias/resumen-reposicion?almacenId=todos');
    expect(request.request.method).toBe('GET');
    const response = {
      bajoMinimo: 1,
      agotadas: 1,
      alertas: [
        { varianteId: 'v1', productoNombre: 'Tornillo', sku: 'TOR-1', almacenId: 'a1', almacenNombre: 'Principal', unidadBaseSimbolo: 'u', cantidadBase: '0.000000', minimoBase: null, tipo: 'agotada' },
        { varianteId: 'v2', productoNombre: 'Clavo', sku: 'CLA-1', almacenId: 'a1', almacenNombre: 'Principal', unidadBaseSimbolo: 'u', cantidadBase: '0.000001', minimoBase: '1.000000', tipo: 'bajo_minimo' },
      ],
    };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
    http.verify();
  });

  it('envía el mínimo en cadena y quita el mínimo con DELETE; propaga errores HTTP', async () => {
    const api = TestBed.inject(ExistenciaApi);
    const http = TestBed.inject(HttpTestingController);
    const guardar = api.guardarMinimo('v1', 'a1', '0.000001');
    const put = http.expectOne('http://localhost:3000/api/existencias/minimos/v1/a1');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ minimoBase: '0.000001' });
    put.flush(null, { status: 204, statusText: 'No Content' });
    await expect(guardar).resolves.toBeNull();

    const quitar = api.quitarMinimo('v1', 'a1');
    const deletion = http.expectOne('http://localhost:3000/api/existencias/minimos/v1/a1');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ message: 'Sin permiso' }, { status: 403, statusText: 'Forbidden' });
    await expect(quitar).rejects.toMatchObject({ status: 403 });
    http.verify();
  });
});
