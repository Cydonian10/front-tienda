import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { QueryClient, provideTanStackQuery } from '@tanstack/angular-query-experimental';
import { MovimientoCajaApi } from '../../api/ventas/movimiento-caja/movimiento-caja-api';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { AuthStore } from '../../store/auth/auth.store';
import { RegistrarMovimientoCajaAction } from './use-movimientos-caja-action';

describe('RegistrarMovimientoCajaAction', () => {
  const crear = vi.fn();
  const dto = { turnoId: 't1', tipo: 'egreso' as const, importe: '10.00', motivo: 'Retiro' };
  let client: QueryClient;
  beforeEach(() => {
    sessionStorage.clear();
    vi.resetAllMocks();
    client = new QueryClient();
    TestBed.configureTestingModule({ providers: [
      provideTanStackQuery(client),
      { provide: MovimientoCajaApi, useValue: { crear } },
      { provide: AuthSessionService, useValue: { get: () => ({ accessToken: 'token' }) } },
      { provide: AuthorizationService, useValue: { hasPermission: () => true } },
    ] });
    TestBed.inject(AuthStore).setProfile({ id: 'u1' } as never);
  });
  afterEach(() => { client.clear(); TestBed.resetTestingModule(); sessionStorage.clear(); });

  it('reintenta un resultado incierto con la misma clave y datos', async () => {
    // Una respuesta perdida conserva el intento antes de permitir otro registro.
    crear.mockRejectedValueOnce(new HttpErrorResponse({ status: 0 })).mockResolvedValueOnce({ id: 'm1' });
    const action = TestBed.inject(RegistrarMovimientoCajaAction);
    const primeraRespuesta = await action.registrar(dto, 'c1');
    const intento = action.pendiente();
    expect(primeraRespuesta).toBe(false);
    expect(intento?.dto).toEqual(dto);
    expect(sessionStorage.getItem('movimiento-caja-pendiente')).not.toBeNull();
    const segundaRespuesta = await action.reintentar();
    expect(segundaRespuesta).toBe(true);
    expect(crear).toHaveBeenNthCalledWith(2, dto, intento?.clave);
    expect(action.pendiente()).toBeNull();
  });

  it('no reintenta con otro usuario y conserva el intento', async () => {
    crear.mockRejectedValue(new HttpErrorResponse({ status: 0 }));
    const action = TestBed.inject(RegistrarMovimientoCajaAction);
    await action.registrar(dto, 'c1');
    TestBed.inject(AuthStore).setProfile({ id: 'u2' } as never);
    const respuesta = await action.reintentar();
    expect(respuesta).toBe(false);
    expect(crear).toHaveBeenCalledTimes(1);
    expect(action.pendiente()).not.toBeNull();
  });

  it('permite corregir una salida rechazada por saldo insuficiente', async () => {
    crear.mockRejectedValue(new HttpErrorResponse({ status: 409, error: { message: 'La salida supera el efectivo esperado de la caja' } }));
    const action = TestBed.inject(RegistrarMovimientoCajaAction);
    const respuesta = await action.registrar(dto, 'c1');
    expect(respuesta).toBe(false);
    expect(action.pendiente()).toBeNull();
    expect(action.error()).toContain('supera el efectivo');
  });
});
