import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MovimientoCajaApi } from './movimiento-caja-api';

describe('MovimientoCajaApi', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('envía las fechas y la página a la API', async () => {
    const resultado = TestBed.inject(MovimientoCajaApi).listar({ desde: '2026-11-07', hasta: '2026-11-08', page: 2, limit: 20 });
    const solicitud = TestBed.inject(HttpTestingController).expectOne((req) => req.url.endsWith('/movimientos-caja'));
    expect(solicitud.request.params.get('desde')).toBe('2026-11-07');
    expect(solicitud.request.params.get('hasta')).toBe('2026-11-08');
    expect(solicitud.request.params.get('page')).toBe('2');
    solicitud.flush({ data: [], total: 0, page: 2, limit: 20 });
    expect((await resultado).total).toBe(0);
  });

  it('envía la clave de idempotencia al registrar', async () => {
    const dto = { turnoId: 't1', tipo: 'ingreso' as const, importe: '1.00', motivo: 'Fondo' };
    const resultado = TestBed.inject(MovimientoCajaApi).crear(dto, 'clave');
    const solicitud = TestBed.inject(HttpTestingController).expectOne((req) => req.url.endsWith('/movimientos-caja'));
    expect(solicitud.request.headers.get('Idempotency-Key')).toBe('clave');
    expect(solicitud.request.body).toEqual(dto);
    solicitud.flush({ id: 'm1' });
    expect((await resultado).id).toBe('m1');
  });
});
