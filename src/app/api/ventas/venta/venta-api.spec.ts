import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SKIP_API_ERROR_TOAST } from '../../../shared/interceptors/api-error.interceptor';
import type { CrearVentaDto, VentaCreada } from '../../interfaces/ventas/venta.interface';
import { VentaApi } from './venta-api';

describe('VentaApi', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('envía el cuerpo decimal y la clave de idempotencia y devuelve la venta registrada', async () => {
    // Preparar una venta con efectivo y la respuesta completa del servidor.
    const dto: CrearVentaDto = {
      turnoId: 'turno-1',
      almacenId: 'almacen-1',
      detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '2.500000' }],
      pagos: [{ medio: 'efectivo', importe: '50.00' }],
    };
    const venta: VentaCreada = {
      id: 'venta-1',
      fecha: '2026-11-06T10:00:00.000Z',
      estado: 'confirmada',
      turnoId: 'turno-1',
      almacenId: 'almacen-1',
      usuarioId: 'usuario-1',
      subtotal: '40.00',
      descuentoPromocional: '0.00',
      descuentoManual: '0.00',
      baseImponible: '33.90',
      igv: '6.10',
      total: '40.00',
      detalles: [
        {
          id: 'detalle-1',
          varianteId: 'variante-1',
          unidadId: 'unidad-1',
          cantidad: '2.500000',
          factorABase: '1.00000000',
          cantidadBase: '2.500000',
          precioUnitario: '16.00',
          subtotal: '40.00',
          descuentoPromocional: '0.00',
          descuentoManual: '0.00',
          total: '40.00',
        },
      ],
      pagos: [
        { id: 'pago-1', medio: 'efectivo', importe: '50.00', fecha: '2026-11-06T10:00:00.000Z' },
      ],
      vuelto: {
        id: 'vuelto-1',
        medio: 'efectivo',
        importe: '10.00',
        fecha: '2026-11-06T10:00:00.000Z',
      },
    };
    const resultado = TestBed.inject(VentaApi).crear(dto, 'clave-venta-1');
    const peticion = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/ventas',
    );

    // Verificar la petición y conservar los datos devueltos sin transformar.
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.headers.get('Idempotency-Key')).toBe('clave-venta-1');
    expect(peticion.request.body).toEqual(dto);
    expect(peticion.request.context.get(SKIP_API_ERROR_TOAST)).toBe(true);
    peticion.flush(venta);
    const ventaRecuperada = await resultado;
    expect(ventaRecuperada).toEqual(venta);
  });

  it('envía Yape y conserva una respuesta sin vuelto', async () => {
    // Preparar un pago exacto mediante Yape.
    const dto: CrearVentaDto = {
      turnoId: 'turno-1',
      almacenId: 'almacen-1',
      detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '1' }],
      pagos: [{ medio: 'yape', importe: '10.00' }],
    };
    const resultado = TestBed.inject(VentaApi).crear(dto, 'clave-yape');
    const peticion = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/ventas',
    );

    // Comprobar que la respuesta nullable llega sin modificaciones.
    expect(peticion.request.body).toEqual(dto);
    expect(peticion.request.headers.get('Idempotency-Key')).toBe('clave-yape');
    peticion.flush({ vuelto: null });
    const ventaRecuperada = await resultado;
    expect(ventaRecuperada.vuelto).toBeNull();
  });

  it('propaga el error de la API para que el flujo de cobro pueda gestionarlo', async () => {
    // Preparar una solicitud que el servidor rechazará por stock insuficiente.
    const dto: CrearVentaDto = {
      turnoId: 'turno-1',
      almacenId: 'almacen-1',
      detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '1' }],
      pagos: [{ medio: 'efectivo', importe: '10.00' }],
    };
    const resultado = TestBed.inject(VentaApi).crear(dto, 'clave-error');
    const peticion = TestBed.inject(HttpTestingController).expectOne(
      'http://localhost:3000/api/ventas',
    );

    // Verificar que el código y el mensaje siguen disponibles para el consumidor.
    peticion.flush({ message: 'Stock insuficiente' }, { status: 409, statusText: 'Conflict' });
    const errorRecuperado: unknown = await resultado.catch((error: unknown) => error);
    expect(errorRecuperado).toBeInstanceOf(HttpErrorResponse);
    if (!(errorRecuperado instanceof HttpErrorResponse))
      throw new Error('Se esperaba un error HTTP');
    expect(errorRecuperado.status).toBe(409);
    expect(errorRecuperado.error).toEqual({ message: 'Stock insuficiente' });
  });
});
