import { DatePipe } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, input } from '@angular/core';
import { PERMISSION_CODES } from '../../../../../api/interfaces/access-control/permision.interface';
import type { CajaConTurnos } from '../../../../../api/interfaces/ventas/caja.interface';
import { usePermissions } from '../../../../../auth/services/use-permissions';
import { AbrirTurnoDialog } from '../abrir-turno-dialog/abrir-turno-dialog';
import { CerrarTurnoDialog } from '../cerrar-turno-dialog/cerrar-turno-dialog';

@Component({
  selector: 'app-caja-card',
  imports: [DatePipe],
  templateUrl: './caja-card.html',
  host: { class: 'block min-w-0' },
})
export class CajaCard {
  private readonly dialog = inject(Dialog);
  readonly permissions = usePermissions('VENTAS', { cajasTurnos: PERMISSION_CODES.CAJAS_TURNOS_READ });
  readonly caja = input.required<CajaConTurnos>();
  readonly turnoAbierto = computed(() =>
    this.caja().turnos.find((turno) => turno.fechaCierre === null),
  );
  readonly ultimoTurno = computed(() => this.turnoAbierto() ?? this.caja().turnos.at(-1));

  abrirTurno(): void {
    if (!this.permissions.cajasTurnos() || !this.caja().activo || this.turnoAbierto()) return;
    const id = `abrir-turno-${this.caja().id}`;
    this.dialog.open(AbrirTurnoDialog, {
      id,
      data: { cajaId: this.caja().id, nombre: this.caja().nombre, turnos: this.caja().turnos },
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: true,
    });
  }

  cerrarTurno(): void {
    const turno = this.turnoAbierto();
    if (!turno || !this.permissions.cajasTurnos()) return;
    const id = `cerrar-turno-${this.caja().id}`;
    this.dialog.open(CerrarTurnoDialog, {
      id,
      data: { cajaId: this.caja().id, nombre: this.caja().nombre, turnoId: turno.id },
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
