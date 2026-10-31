import { DatePipe } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { Component, computed, inject, input } from '@angular/core';
import type { CajaConTurnos } from '../../../../../api/interfaces/ventas/caja.interface';
import { AbrirTurnoDialog } from '../abrir-turno-dialog/abrir-turno-dialog';

@Component({
  selector: 'app-caja-card',
  imports: [DatePipe],
  templateUrl: './caja-card.html',
  host: { class: 'block min-w-0' },
})
export class CajaCard {
  private readonly dialog = inject(Dialog);
  readonly caja = input.required<CajaConTurnos>();
  readonly turnoAbierto = computed(() =>
    this.caja().turnos.find((turno) => turno.fechaCierre === null),
  );
  readonly ultimoTurno = computed(() => this.turnoAbierto() ?? this.caja().turnos.at(-1));

  abrirTurno(): void {
    if (!this.caja().activo || this.turnoAbierto()) return;
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
}
