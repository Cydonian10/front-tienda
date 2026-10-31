import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import type { CajaConTurnos } from '../../../../../api/interfaces/ventas/caja.interface';

@Component({
  selector: 'app-caja-card',
  imports: [DatePipe],
  templateUrl: './caja-card.html',
  host: { class: 'block min-w-0' },
})
export class CajaCard {
  readonly caja = input.required<CajaConTurnos>();
  readonly turnoAbierto = computed(() =>
    this.caja().turnos.find((turno) => turno.fechaCierre === null),
  );
  readonly ultimoTurno = computed(() => this.turnoAbierto() ?? this.caja().turnos.at(-1));
}
