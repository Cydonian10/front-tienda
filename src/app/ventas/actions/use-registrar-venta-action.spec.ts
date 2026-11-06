import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import type { AuthPerfil } from '../../api/interfaces/access-control/auth.interface';
import type { CrearVentaDto, VentaCreada } from '../../api/interfaces/ventas/venta.interface';
import { VentaApi } from '../../api/ventas/venta/venta-api';
import { AuthProfileService } from '../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AuthStore } from '../../store/auth/auth.store';
import { RegistrarVentaAction, useRegistrarVenta } from './use-registrar-venta-action';

describe('RegistrarVentaAction', () => {
  const crear = vi.fn();
  const cargarPerfil = vi.fn();
  const obtenerSesion = vi.fn();
  let client: QueryClient;
  let auth: AuthStore;
  let action: RegistrarVentaAction;

  const solicitud = () => ({
    turnoId: 'turno-1',
    almacenId: 'almacen-1',
    detalles: [{ varianteId: 'variante-1', unidadId: 'unidad-1', cantidad: '2' }],
    pagos: [{ medio: 'efectivo' as const, importe: '50.00' }] as [
      { medio: 'efectivo'; importe: string },
    ],
  });
  const venta = { id: 'venta-1', total: '40.00', vuelto: null } as VentaCreada;

  beforeEach(() => {
    vi.resetAllMocks();
    client = new QueryClient();
    obtenerSesion.mockReturnValue({ accessToken: 'token-1' });
    cargarPerfil.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        provideTanStackQuery(client),
        { provide: VentaApi, useValue: { crear } },
        { provide: AuthProfileService, useValue: { load: cargarPerfil } },
        { provide: AuthSessionService, useValue: { get: obtenerSesion } },
      ],
    });
    auth = TestBed.inject(AuthStore);
    auth.setProfile({ id: 'usuario-1' } as AuthPerfil);
    action = TestBed.runInInjectionContext(() => useRegistrarVenta());
  });

  afterEach(() => {
    client.clear();
    TestBed.resetTestingModule();
  });

  it('confirma la venta y captura el cuerpo antes de verificar la sesión', async () => {
    // Cambiar el formulario mientras se verifica el perfil no cambia la solicitud enviada.
    let terminarPerfil!: () => void;
    cargarPerfil.mockReturnValue(
      new Promise<void>((resolve) => {
        terminarPerfil = resolve;
      }),
    );
    crear.mockResolvedValue(venta);
    const dto = solicitud();
    const registro = action.registrar(dto);
    dto.detalles[0].cantidad = '8';
    dto.pagos[0].importe = '80.00';
    terminarPerfil();
    await registro;

    // La instantánea y la respuesta se conservan sin transformar.
    const [cuerpo, clave] = crear.mock.calls[0] as [CrearVentaDto, string];
    expect(cargarPerfil).toHaveBeenCalledWith(true);
    expect(cuerpo.detalles[0].cantidad).toBe('2');
    expect(cuerpo.pagos[0].importe).toBe('50.00');
    expect(clave).toBeTruthy();
    expect(Object.isFrozen(cuerpo)).toBe(true);
    expect(Object.isFrozen(cuerpo.detalles[0])).toBe(true);
    const estado = action.estado();
    expect(estado).toEqual({ tipo: 'confirmado', venta });
  });

  it('reintenta un resultado incierto con la misma clave, cuerpo y usuario', async () => {
    // El primer envío pierde la respuesta y no permite iniciar otra venta.
    crear.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 })).mockResolvedValueOnce(venta);
    const dto = solicitud();
    await action.registrar(dto);
    const estadoIncierto = action.estado();
    expect(estadoIncierto.tipo).toBe('incierto');
    await action.registrar(solicitud());
    expect(crear).toHaveBeenCalledTimes(1);

    // Un reintento usa la misma instantánea aunque los datos originales hayan cambiado.
    dto.detalles[0].cantidad = '9';
    await action.reintentar();
    const primeraPeticion = crear.mock.calls[0];
    const segundaPeticion = crear.mock.calls[1];
    expect(segundaPeticion).toEqual(primeraPeticion);
    expect(segundaPeticion[0].detalles[0].cantidad).toBe('2');
    expect(action.estado()).toEqual({ tipo: 'confirmado', venta });
  });

  it('conserva el intento incierto cuando cambia el usuario o se pierde la sesión', async () => {
    // Un error 5xx no permite saber si la venta fue registrada.
    crear.mockRejectedValueOnce(new HttpErrorResponse({ status: 500 }));
    await action.registrar(solicitud());
    const estadoInicial = action.estado();
    if (estadoInicial.tipo !== 'incierto') throw new Error('Se esperaba un resultado incierto');

    // Otro usuario y una sesión ausente no pueden reenviar la venta.
    auth.setProfile({ id: 'usuario-2' } as AuthPerfil);
    await action.reintentar();
    expect(crear).toHaveBeenCalledTimes(1);
    const estadoOtroUsuario = action.estado();
    expect(estadoOtroUsuario.tipo).toBe('incierto');
    if (estadoOtroUsuario.tipo !== 'incierto') throw new Error('Se esperaba un resultado incierto');
    expect(estadoOtroUsuario.intento).toBe(estadoInicial.intento);
    expect((estadoOtroUsuario.error as Error).message).toContain('Verifica el resultado');

    obtenerSesion.mockReturnValue(null);
    await action.reintentar();
    expect(crear).toHaveBeenCalledTimes(1);
    expect(action.estado().tipo).toBe('incierto');
  });

  it('distingue un rechazo de negocio de un conflicto de clave y usa una clave nueva tras corregir', async () => {
    // Un rechazo por stock es concluyente y permite crear un nuevo intento.
    crear.mockRejectedValueOnce(
      new HttpErrorResponse({ status: 409, error: { message: 'Stock insuficiente' } }),
    );
    await action.registrar(solicitud());
    expect(action.estado().tipo).toBe('rechazado');

    // Un conflicto de clave requiere revisión y conserva el intento.
    crear.mockRejectedValueOnce(
      new HttpErrorResponse({
        status: 409,
        error: { message: 'La clave ya corresponde a otra venta' },
      }),
    );
    await action.registrar(solicitud());
    const estadoRevision = action.estado();
    expect(estadoRevision.tipo).toBe('revision');
    expect(crear.mock.calls[0][1]).not.toBe(crear.mock.calls[1][1]);
    await action.reintentar();
    await action.registrar(solicitud());
    expect(crear).toHaveBeenCalledTimes(2);
  });

  it('no envía solicitudes simultáneas mientras una venta está en curso', async () => {
    // Mantener la respuesta pendiente mientras se intenta cobrar de nuevo.
    let responder!: (valor: VentaCreada) => void;
    crear.mockReturnValue(
      new Promise<VentaCreada>((resolve) => {
        responder = resolve;
      }),
    );
    const primerRegistro = action.registrar(solicitud());
    await vi.waitFor(() => expect(action.estado().tipo).toBe('enviando'));
    await action.registrar(solicitud());
    await action.reintentar();
    expect(crear).toHaveBeenCalledTimes(1);
    responder(venta);
    await primerRegistro;
    expect(action.estado().tipo).toBe('confirmado');
  });

  it('no descarta un resultado incierto si el reintento pierde autorización', async () => {
    // La autorización fallida en el reintento no resuelve el primer envío.
    crear
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 0 }))
      .mockRejectedValueOnce(new HttpErrorResponse({ status: 401 }));
    await action.registrar(solicitud());
    await action.reintentar();
    const estado = action.estado();
    expect(estado.tipo).toBe('incierto');
    expect(crear.mock.calls[1]).toEqual(crear.mock.calls[0]);
  });

  it('no envía si el token cambia después de verificar el perfil', async () => {
    // Simular un cambio de sesión justo antes de ejecutar la mutación.
    obtenerSesion
      .mockReturnValueOnce({ accessToken: 'token-1' })
      .mockReturnValueOnce({ accessToken: 'token-1' })
      .mockReturnValue({ accessToken: 'token-2' });
    await action.registrar(solicitud());

    // El intento se rechaza antes de llegar al cliente HTTP.
    const estado = action.estado();
    expect(estado.tipo).toBe('rechazado');
    expect(crear).not.toHaveBeenCalled();
  });
});
