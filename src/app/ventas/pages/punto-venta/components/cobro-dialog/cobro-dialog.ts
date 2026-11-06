import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { filter } from 'rxjs';
import { PERMISSION_CODES } from '../../../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../../../auth/services/use-permissions';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { apiMessage } from '../../../../../shared/interceptors/api-error.interceptor';
import { useRegistrarVenta } from '../../../../actions/use-registrar-venta-action';
import { PreparacionVentaService } from '../../../../services/preparacion-venta.service';
import { CarritoVentaService, solesCentavos } from '../../service/carrito-venta.service';
import { VentaConfirmadaDialog } from '../venta-confirmada-dialog/venta-confirmada-dialog';

@Component({
  selector: 'app-cobro-dialog',
  imports: [DialogShell],
  templateUrl: './cobro-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CobroDialog {
  readonly dialogRef = inject(DialogRef);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly queryClient = inject(QueryClient);
  private readonly preparacion = inject(PreparacionVentaService);
  private readonly permisos = usePermissions('VENTAS', {
    vender: PERMISSION_CODES.CAJAS_TURNOS_READ,
  });
  readonly registro = useRegistrarVenta();
  readonly puedeVender = this.permisos.vender;
  readonly carrito = inject(CarritoVentaService);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly descripcionId = `${this.dialogRef.id}-descripcion`;
  readonly montoId = `${this.dialogRef.id}-monto`;
  readonly errorMontoId = `${this.dialogRef.id}-monto-error`;
  readonly medioPagoId = `${this.dialogRef.id}-medio-pago`;
  readonly soles = solesCentavos;
  readonly medioPago = signal<'efectivo' | 'yape'>('efectivo');
  readonly monto = signal('');
  readonly totalValido = computed(() => this.carrito.total() > 0n);
  readonly enCurso = computed(() =>
    ['verificando', 'enviando'].includes(this.registro.estado().tipo),
  );
  readonly bloqueado = computed(
    () => this.registro.bloqueado() || this.registro.estado().tipo === 'confirmado',
  );
  readonly seleccionValida = computed(() => {
    const seleccion = this.preparacion.seleccion();
    return !!seleccion?.almacenId?.trim() && !!seleccion?.turnoId?.trim();
  });
  readonly lineasValidas = computed(() => {
    const lineas = this.carrito.lineas();
    const pares = new Set<string>();
    return (
      lineas.length > 0 &&
      lineas.every((linea) => {
        const variante = linea.variante.id?.trim();
        const unidad = linea.unidad.id?.trim();
        const par = `${variante?.toLowerCase()}:${unidad?.toLowerCase()}`;
        if (
          !variante ||
          !unidad ||
          !/^\d{1,14}(?:\.\d{1,6})?$/.test(linea.cantidad) ||
          !/[1-9]/.test(linea.cantidad) ||
          pares.has(par)
        )
          return false;
        pares.add(par);
        return true;
      })
    );
  });
  readonly puedeRegistrar = computed(
    () =>
      !this.bloqueado() &&
      this.permisos.vender() &&
      this.seleccionValida() &&
      this.lineasValidas() &&
      this.totalValido() &&
      !this.errorMonto(),
  );

  readonly montoCentavos = computed(() => {
    const partes = /^(\d{1,16})(?:\.(\d{1,2}))?$/.exec(this.monto().trim());
    return partes ? BigInt(partes[1]) * 100n + BigInt((partes[2] ?? '').padEnd(2, '0')) : null;
  });
  readonly errorMonto = computed(() => {
    const monto = this.montoCentavos();
    if (monto === null) return 'Ingresa un monto válido con hasta dos decimales.';
    if (monto <= 0n) return 'El monto recibido debe ser mayor que cero.';
    if (this.medioPago() === 'yape' && monto !== this.carrito.total())
      return 'El monto de Yape debe ser igual al total.';
    if (this.medioPago() === 'efectivo' && monto < this.carrito.total())
      return 'El monto recibido debe cubrir el total.';
    return '';
  });
  readonly vuelto = computed(() => {
    const monto = this.montoCentavos();
    return monto !== null && monto >= this.carrito.total() ? monto - this.carrito.total() : null;
  });

  constructor() {
    this.dialogRef.disableClose = this.registro.bloqueado();
    this.router.events
      .pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (!this.bloqueado()) this.dialogRef.close();
      });
  }

  seleccionarMedio(medio: 'efectivo' | 'yape'): void {
    this.medioPago.set(medio);
    if (medio === 'yape') this.usarMontoExacto();
    else this.monto.set('');
  }

  usarMontoExacto(): void {
    const total = this.carrito.total();
    this.monto.set(`${total / 100n}.${String(total % 100n).padStart(2, '0')}`);
  }

  async registrarCobro(): Promise<void> {
    if (!this.puedeRegistrar() || this.router.currentNavigation()) return;
    const seleccion = this.preparacion.seleccion();
    const monto = this.montoCentavos();
    if (!seleccion || monto === null) return;
    const importe = `${monto / 100n}.${String(monto % 100n).padStart(2, '0')}`;
    this.dialogRef.disableClose = true;
    await this.registro.registrar({
      turnoId: seleccion.turnoId,
      almacenId: seleccion.almacenId,
      detalles: this.carrito.lineas().map((linea) => ({
        varianteId: linea.variante.id,
        unidadId: linea.unidad.id,
        cantidad: linea.cantidad,
      })),
      pagos: [{ medio: this.medioPago(), importe }],
    });
    this.procesarResultado(seleccion.almacenId);
  }

  async reintentar(): Promise<void> {
    const estado = this.registro.estado();
    if (estado.tipo !== 'incierto' || this.router.currentNavigation()) return;
    this.dialogRef.disableClose = true;
    await this.registro.reintentar();
    this.procesarResultado(estado.intento.dto.almacenId);
  }

  cancelar(): void {
    if (!this.bloqueado()) this.dialogRef.close();
  }

  async cambiarTurno(): Promise<void> {
    if (!this.turnoCerrado()) return;
    this.preparacion.recuperarTurno();
    const navego = await this.router.navigate(['/admin/ventas/preparacion']);
    if (!navego) this.preparacion.finalizarRecuperacion();
  }

  readonly turnoCerrado = computed(() => {
    const estado = this.registro.estado();
    return (
      estado.tipo === 'rechazado' &&
      estado.error instanceof HttpErrorResponse &&
      estado.error.status === 409 &&
      estado.error.error?.message === 'El turno está cerrado'
    );
  });

  readonly mensajeError = computed(() => {
    const estado = this.registro.estado();
    if (estado.tipo === 'revision')
      return 'El registro necesita revisión. Verifica manualmente la venta antes de volver a cobrar.';
    if (estado.tipo === 'incierto') {
      const aviso =
        'No se sabe si la venta se registró. Reintenta con el mismo usuario; no vuelvas a cobrarla.';
      if (estado.error instanceof Error && estado.error.message.startsWith('La sesión cambió.'))
        return `${aviso} ${estado.error.message}`;
      if (
        estado.error instanceof Error &&
        estado.error.message === 'Ya no tienes acceso al punto de venta.'
      )
        return `${aviso} ${estado.error.message}`;
      return aviso;
    }
    if (estado.tipo === 'rechazado') {
      return estado.error instanceof HttpErrorResponse
        ? apiMessage(estado.error)
        : estado.error instanceof Error
          ? estado.error.message
          : 'No se pudo registrar la venta.';
    }
    return '';
  });

  private procesarResultado(almacenId: string): void {
    const estado = this.registro.estado();
    this.dialogRef.disableClose = this.registro.bloqueado();
    if (estado.tipo === 'confirmado') {
      this.carrito.vaciar();
      void this.queryClient.invalidateQueries({ queryKey: ['ventas', 'catalogo', almacenId] });
      this.registro.consumirConfirmacion();
      this.dialogRef.close();
      const id = `${this.dialogRef.id}-confirmacion`;
      this.dialog.open(VentaConfirmadaDialog, {
        id,
        data: estado.venta,
        width: '34rem',
        maxWidth: 'calc(100vw - 2rem)',
        ariaModal: true,
        ariaLabelledBy: `${id}-title`,
        autoFocus: 'button',
        restoreFocus: true,
        disableClose: true,
      });
    } else if (
      estado.tipo === 'rechazado' &&
      estado.error instanceof HttpErrorResponse &&
      estado.error.status === 409 &&
      estado.error.error?.message === 'Stock insuficiente'
    ) {
      void this.queryClient.invalidateQueries({ queryKey: ['ventas', 'catalogo', almacenId] });
    }
  }
}
