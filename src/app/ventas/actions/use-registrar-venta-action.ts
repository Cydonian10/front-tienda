import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { CrearVentaDto, VentaCreada } from '../../api/interfaces/ventas/venta.interface';
import { VentaApi } from '../../api/ventas/venta/venta-api';
import { AuthProfileService } from '../../auth/services/auth-profile.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { AuthStore } from '../../store/auth/auth.store';

export interface IntentoVenta {
  readonly dto: CrearVentaDto;
  readonly clave: string;
  readonly usuarioId: string;
}

export type EstadoRegistroVenta =
  | { tipo: 'listo' }
  | { tipo: 'verificando'; intento: IntentoVenta | null }
  | { tipo: 'enviando'; intento: IntentoVenta }
  | { tipo: 'incierto'; intento: IntentoVenta; error: unknown }
  | { tipo: 'revision'; intento: IntentoVenta; error: unknown }
  | { tipo: 'rechazado'; error: unknown }
  | { tipo: 'confirmado'; venta: VentaCreada };

class SesionCambioError extends Error {
  constructor() {
    super('La sesión cambió. Verifica el resultado de la venta antes de volver a cobrar.');
  }
}

function copiarSolicitud(dto: CrearVentaDto): CrearVentaDto {
  const detalles = Object.freeze(
    dto.detalles.map(({ varianteId, unidadId, cantidad }) =>
      Object.freeze({ varianteId, unidadId, cantidad }),
    ),
  );
  const { medio, importe } = dto.pagos[0];
  const pagos = Object.freeze([Object.freeze({ medio, importe })] as const);
  return Object.freeze({ turnoId: dto.turnoId, almacenId: dto.almacenId, detalles, pagos });
}

function conflictoConocido(error: HttpErrorResponse): boolean {
  const mensaje = error.error?.message;
  return (
    typeof mensaje === 'string' &&
    [
      'El turno está cerrado',
      'Stock insuficiente',
      'Los pagos son insuficientes',
      'El vuelto supera el efectivo recibido',
    ].includes(mensaje)
  );
}

@Injectable({ providedIn: 'root' })
export class RegistrarVentaAction {
  private readonly api = inject(VentaApi);
  private readonly perfil = inject(AuthProfileService);
  private readonly sesion = inject(AuthSessionService);
  private readonly auth = inject(AuthStore);
  private readonly authorization = inject(AuthorizationService);
  private readonly estadoInterno = signal<EstadoRegistroVenta>({ tipo: 'listo' });
  readonly estado = this.estadoInterno.asReadonly();
  readonly bloqueado = computed(() =>
    ['verificando', 'enviando', 'incierto', 'revision', 'confirmado'].includes(this.estado().tipo),
  );
  private tokenVerificado: string | null = null;

  private readonly mutation = injectMutation(() => ({
    retry: false,
    mutationFn: (intento: IntentoVenta) => {
      const token = this.tokenVerificado;
      this.tokenVerificado = null;
      if (
        !token ||
        this.sesion.get()?.accessToken !== token ||
        this.auth.authPerfil()?.id !== intento.usuarioId ||
        !this.authorization.hasPermission('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)
      ) {
        throw new SesionCambioError();
      }
      return this.api.crear(intento.dto, intento.clave);
    },
  }));

  async registrar(dto: CrearVentaDto): Promise<void> {
    const actual = this.estado();
    if (actual.tipo !== 'listo' && actual.tipo !== 'rechazado') return;
    this.estadoInterno.set({ tipo: 'verificando', intento: null });

    let intento: IntentoVenta;
    try {
      const cuerpo = copiarSolicitud(dto);
      const usuarioId = await this.verificarUsuario();
      intento = Object.freeze({ dto: cuerpo, clave: globalThis.crypto.randomUUID(), usuarioId });
    } catch (error) {
      this.tokenVerificado = null;
      this.estadoInterno.set({ tipo: 'rechazado', error });
      return;
    }
    await this.enviar(intento, false);
  }

  async reintentar(): Promise<void> {
    const actual = this.estado();
    if (actual.tipo !== 'incierto') return;
    const intento = actual.intento;
    this.estadoInterno.set({ tipo: 'verificando', intento });

    try {
      const usuarioId = await this.verificarUsuario();
      if (usuarioId !== intento.usuarioId) throw new SesionCambioError();
    } catch (error) {
      this.tokenVerificado = null;
      this.estadoInterno.set({ tipo: 'incierto', intento, error });
      return;
    }
    await this.enviar(intento, true);
  }

  consumirConfirmacion(): void {
    if (this.estado().tipo === 'confirmado') this.estadoInterno.set({ tipo: 'listo' });
  }

  private async verificarUsuario(): Promise<string> {
    const token = this.sesion.get()?.accessToken;
    if (!token) throw new SesionCambioError();
    await this.perfil.load(true);
    const usuarioId = this.auth.authPerfil()?.id;
    if (!usuarioId || this.sesion.get()?.accessToken !== token) throw new SesionCambioError();
    if (!this.authorization.hasPermission('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)) {
      throw new Error('Ya no tienes acceso al punto de venta.');
    }
    this.tokenVerificado = token;
    return usuarioId;
  }

  private async enviar(intento: IntentoVenta, eraIncierto: boolean): Promise<void> {
    this.estadoInterno.set({ tipo: 'enviando', intento });
    try {
      const venta = await this.mutation.mutateAsync(intento);
      this.estadoInterno.set({ tipo: 'confirmado', venta });
    } catch (error) {
      if (error instanceof SesionCambioError) {
        this.estadoInterno.set(
          eraIncierto ? { tipo: 'incierto', intento, error } : { tipo: 'rechazado', error },
        );
      } else if (
        error instanceof HttpErrorResponse &&
        error.status === 409 &&
        !conflictoConocido(error)
      ) {
        this.estadoInterno.set({ tipo: 'revision', intento, error });
      } else if (
        !eraIncierto &&
        error instanceof HttpErrorResponse &&
        ([400, 401, 403, 404].includes(error.status) ||
          (error.status === 409 && conflictoConocido(error)))
      ) {
        this.estadoInterno.set({ tipo: 'rechazado', error });
      } else {
        this.estadoInterno.set({ tipo: 'incierto', intento, error });
      }
    } finally {
      this.tokenVerificado = null;
    }
  }
}

export function useRegistrarVenta(): RegistrarVentaAction {
  return inject(RegistrarVentaAction);
}
