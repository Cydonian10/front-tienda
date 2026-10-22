import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { NuevoMovimiento } from '../interfaces/inventario/movimiento.interface';
import { MovimientoApi } from './movimiento-api';

describe('MovimientoApi', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('obtiene los almacenes activos', async () => {
    const result = TestBed.inject(MovimientoApi).listarAlmacenes();
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/movimientos/almacenes',
    );
    expect(request.request.method).toBe('GET');
    const almacenes = [{ id: 'almacen-1', nombre: 'Principal' }];
    request.flush(almacenes);
    await expect(result).resolves.toEqual(almacenes);
  });

  it('busca variantes por tipo, almacén y término con paginación y decimales intactos', async () => {
    const result = TestBed.inject(MovimientoApi).buscarVariantes({
      tipo: 'salida',
      almacenId: 'almacen-1',
      q: 'tornillo M8',
      page: 2,
      limit: 20,
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/movimientos/variantes?tipo=salida&almacenId=almacen-1&q=tornillo%20M8&page=2&limit=20',
    );
    expect(request.request.method).toBe('GET');
    const response = {
      data: [{
        producto: { id: 'producto-1', nombre: 'Tornillo', activo: true },
        variante: { id: 'variante-1', sku: 'TOR-M8', activo: false },
        cantidadBase: '25.000000',
        unidades: [{ id: 'unidad-1', nombre: 'Caja', simbolo: 'cja', factorABase: '12.00000000' }],
      }],
      meta: { page: 2, limit: 20, total: 25, totalPages: 2 },
    };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('envía JSON con clave idempotente y decimales sin calcular saldos ni costos de salida', async () => {
    const movimiento: NuevoMovimiento = {
      idempotenciaClave: '550e8400-e29b-41d4-a716-446655440006',
      tipo: 'traslado',
      almacenOrigenId: 'almacen-1',
      almacenDestinoId: 'almacen-2',
      detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '2.500000' }],
    };
    const result = TestBed.inject(MovimientoApi).crear(movimiento);
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/movimientos',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(movimiento);
    expect(Object.keys(request.request.body)).toEqual(Object.keys(movimiento));
    const response = { id: 'movimiento-1', tipo: 'traslado', estado: 'confirmado' };
    request.flush(response);
    await expect(result).resolves.toEqual(response);
  });

  it('incluye motivo y costo unitario base en ajustes positivos', async () => {
    const movimiento: NuevoMovimiento = {
      idempotenciaClave: '550e8400-e29b-41d4-a716-446655440007',
      tipo: 'ajuste',
      almacenOrigenId: 'almacen-1',
      motivo: 'Inventario físico',
      detalles: [{
        varianteId: 'variante-1',
        unidadId: 'unidad-1',
        cantidad: '1.250000',
        costoUnitarioBase: '0',
      }],
    };
    const result = TestBed.inject(MovimientoApi).crear(movimiento);
    const request = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/movimientos',
    );
    expect(request.request.body).toEqual(movimiento);
    request.flush({ id: 'movimiento-2', tipo: 'ajuste', estado: 'confirmado' });
    await expect(result).resolves.toMatchObject({ id: 'movimiento-2' });
  });

  it('propaga rechazos y fallos de red sin interpretarlos como confirmación', async () => {
    const api = TestBed.inject(MovimientoApi);
    const http = TestBed.inject(HttpTestingController);
    const movimiento: NuevoMovimiento = {
      idempotenciaClave: '550e8400-e29b-41d4-a716-446655440008',
      tipo: 'salida',
      almacenOrigenId: 'almacen-1',
      detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '1' }],
    };

    const rechazo = api.crear(movimiento);
    http.expectOne('http://localhost:3000/api/movimientos').flush(
      { message: 'Saldo insuficiente' },
      { status: 409, statusText: 'Conflict' },
    );
    await expect(rechazo).rejects.toMatchObject({ status: 409 });

    const fallo = api.crear(movimiento);
    const request = http.expectOne('http://localhost:3000/api/movimientos');
    expect(request.request.body).toEqual(movimiento);
    request.error(new ProgressEvent('error'));
    await expect(fallo).rejects.toMatchObject({ status: 0 });
  });
});
