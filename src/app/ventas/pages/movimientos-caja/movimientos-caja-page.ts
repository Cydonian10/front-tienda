import { Dialog } from '@angular/cdk/dialog';
import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { RegistrarMovimientoDialog } from './components/registrar-movimiento-dialog/registrar-movimiento-dialog';
import {
  RegistrarMovimientoCajaAction,
  useListadoMovimientosCaja,
} from '../../actions/use-movimientos-caja-action';

@Component({
  selector: 'app-movimientos-caja-page',
  imports: [DatePipe, Pagination],
  templateUrl: './movimientos-caja-page.html',
  host: { class: 'block' },
})
export default class MovimientosCajaPage {
  private readonly dialog = inject(Dialog);
  readonly registro = inject(RegistrarMovimientoCajaAction);
  private readonly hoy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  readonly desde = signal(this.hoy);
  readonly hasta = signal(this.hoy);
  readonly filtro = signal({ desde: this.hoy, hasta: this.hoy, page: 1, limit: 5 });
  readonly errorFechas = signal('');
  readonly confirmacion = signal('');
  readonly listado = useListadoMovimientosCaja(() => this.filtro());
  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil((this.listado.data()?.total ?? 0) / this.filtro().limit)),
  );
  readonly permissions = usePermissions('VENTAS', {
    cajasTurnos: PERMISSION_CODES.CAJAS_TURNOS_READ,
    crearMovimiento: PERMISSION_CODES.MOVIMIENTOS_CAJA_CREATE,
  });

  aplicarFiltro(): void {
    const desde = this.desde();
    const hasta = this.hasta();
    if (!desde || !hasta || desde > hasta) {
      this.errorFechas.set('Selecciona un rango de fechas válido.');
      return;
    }
    this.errorFechas.set('');
    this.filtro.update((filtro) => ({ ...filtro, desde, hasta, page: 1 }));
  }

  cambiarPagina(page: number): void {
    if (page < 1 || page > this.totalPaginas()) return;
    this.filtro.update((filtro) => ({ ...filtro, page }));
  }

  cambiarLimite(limit: number): void {
    if (![5, 10, 20].includes(limit) || limit === this.filtro().limit) return;
    this.filtro.update((filtro) => ({ ...filtro, limit, page: 1 }));
  }

  async reintentarRegistro(): Promise<void> {
    this.confirmacion.set('');
    if (await this.registro.reintentar())
      this.confirmacion.set('Movimiento registrado correctamente.');
  }

  abrirRegistro(): void {
    if (!this.permissions.crearMovimiento() || this.registro.bloqueado()) return;
    this.registro.error.set('');
    this.confirmacion.set('');
    const id = 'registrar-movimiento-caja';
    this.dialog.open(RegistrarMovimientoDialog, {
      id,
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }
}
