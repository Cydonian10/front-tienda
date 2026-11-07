import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { CrearMovimientoCajaDto, FiltroMovimientosCaja } from '../../api/interfaces/ventas/movimiento-caja.interface';
import { MovimientoCajaApi } from '../../api/ventas/movimiento-caja/movimiento-caja-api';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AuthStore } from '../../store/auth/auth.store';
import { cajasListadoQueryKey } from './use-cajas-action';
import { resumenTurnoQueryKey } from './use-caja-turnos-action';

export const movimientosCajaKey = ['movimientos-caja'] as const;
export function useListadoMovimientosCaja(filtro: () => FiltroMovimientosCaja | null) {
  const api = inject(MovimientoCajaApi);
  return injectQuery(() => {
    const actual = filtro();
    return {
      queryKey: [...movimientosCajaKey, actual?.desde, actual?.hasta, actual?.page, actual?.limit],
      queryFn: () => api.listar(actual!), enabled: !!actual, retry: false,
    };
  });
}

interface Intento { usuarioId: string; clave: string; dto: CrearMovimientoCajaDto; cajaId: string }
const STORAGE_KEY = 'movimiento-caja-pendiente';
class SesionCambioError extends Error {}

@Injectable({ providedIn: 'root' })
export class RegistrarMovimientoCajaAction {
  private readonly api = inject(MovimientoCajaApi);
  private readonly client = inject(QueryClient);
  private readonly auth = inject(AuthStore);
  private readonly session = inject(AuthSessionService);
  private readonly authorization = inject(AuthorizationService);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly intento = signal<Intento | null>(this.recuperar());
  readonly pendiente = this.intento.asReadonly();
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly bloqueado = computed(() => this.enviando() || !!this.pendiente());
  private tokenAEnviar: string | null = null;
  private readonly mutation = injectMutation(() => ({ retry: false, mutationFn: (intento: Intento) => {
    if (!this.tokenAEnviar || this.session.get()?.accessToken !== this.tokenAEnviar ||
      this.auth.authPerfil()?.id !== intento.usuarioId || !this.autorizado()) throw new SesionCambioError();
    return this.api.crear(intento.dto, intento.clave);
  } }));

  async registrar(dto: CrearMovimientoCajaDto, cajaId: string): Promise<boolean> {
    if (this.bloqueado()) return false;
    if (!this.autorizado()) { this.error.set('No tienes permiso o tu sesión ha terminado.'); return false; }
    const usuarioId = this.auth.authPerfil()?.id;
    if (!usuarioId || !this.browser) { this.error.set('No se pudo verificar la sesión.'); return false; }
    const intento: Intento = { usuarioId, clave: crypto.randomUUID(), dto: { ...dto }, cajaId };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intento)); }
    catch { this.error.set('No se puede guardar el intento de forma segura. Revisa el almacenamiento del navegador.'); return false; }
    this.intento.set(intento);
    return this.enviar(intento, false);
  }

  async reintentar(): Promise<boolean> {
    const intento = this.pendiente();
    if (!intento || this.enviando()) return false;
    if (!this.autorizado() || this.auth.authPerfil()?.id !== intento.usuarioId) {
      this.error.set('Para verificar el resultado, inicia sesión con el mismo usuario y permiso.');
      return false;
    }
    return this.enviar(intento, true);
  }

  private autorizado(): boolean {
    return !!this.session.get() && this.authorization.hasPermission('VENTAS', PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE);
  }

  private recuperar(): Intento | null {
    if (!this.browser) return null;
    try { const texto = sessionStorage.getItem(STORAGE_KEY); return texto ? JSON.parse(texto) as Intento : null; }
    catch { return null; }
  }

  private async enviar(intento: Intento, reintento: boolean): Promise<boolean> {
    this.enviando.set(true);
    this.error.set('');
    this.tokenAEnviar = this.session.get()?.accessToken ?? null;
    try {
      await this.mutation.mutateAsync(intento);
    } catch (error) {
      const mensaje = error instanceof HttpErrorResponse && typeof error.error?.message === 'string' ? error.error.message : '';
      const rechazoSeguro = error instanceof SesionCambioError || (error instanceof HttpErrorResponse && ([400, 401, 403, 404].includes(error.status) ||
        (error.status === 409 && ['El turno está cerrado', 'La salida supera el efectivo esperado de la caja'].includes(mensaje))));
      if (!reintento && rechazoSeguro) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
          this.intento.set(null);
          this.error.set(mensaje || 'No se pudo registrar el movimiento. Verifica tu sesión.');
        } catch { this.error.set('No se pudo limpiar el intento guardado. Reintenta con el mismo usuario.'); }
      } else {
        this.error.set('No se pudo confirmar el resultado. Reintenta con el mismo usuario; no registres el movimiento de nuevo.');
      }
      this.tokenAEnviar = null;
      this.enviando.set(false);
      return false;
    }
    this.tokenAEnviar = null;
    try { sessionStorage.removeItem(STORAGE_KEY); }
    catch {
      this.error.set('El movimiento fue recibido, pero no se pudo limpiar el intento. Reintenta para verificarlo.');
      this.enviando.set(false);
      return false;
    }
    this.intento.set(null);
    await Promise.allSettled([
      this.client.invalidateQueries({ queryKey: movimientosCajaKey }),
      this.client.invalidateQueries({ queryKey: cajasListadoQueryKey }),
      this.client.invalidateQueries({ queryKey: resumenTurnoQueryKey(intento.cajaId, intento.dto.turnoId) }),
    ]);
    this.enviando.set(false);
    return true;
  }
}
