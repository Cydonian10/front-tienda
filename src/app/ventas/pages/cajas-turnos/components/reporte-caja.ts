import { Component, input, output } from '@angular/core';
import type { ReporteCajaDemo } from '../../../demo/cajas-turnos-demo.models';

const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const fecha = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});
const hora = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });

@Component({
  selector: 'app-reporte-caja',
  templateUrl: './reporte-caja.html',
})
export class ReporteCaja {
  readonly reporte = input.required<ReporteCajaDemo>();
  readonly cerrar = output<void>();

  importe(centavos: number): string {
    return moneda.format(centavos / 100);
  }

  fechaTexto(valor: string): string {
    return fecha.format(new Date(`${valor}T12:00:00Z`));
  }

  horaTexto(valor: string): string {
    return hora.format(new Date(valor));
  }
}
