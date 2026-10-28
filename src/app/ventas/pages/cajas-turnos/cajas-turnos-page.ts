import { Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { resumenTurno } from '../../demo/cajas-turnos-demo-calculos';
import { CajasTurnosDemoStore } from '../../demo/cajas-turnos-demo.store';
import type { DemoCaja, DemoTurno, ResumenTurnoDemo } from '../../demo/cajas-turnos-demo.models';

type FiltroCajas = 'todas' | 'abiertas' | 'cerradas';

interface CajaVisible {
  caja: DemoCaja;
  turnoAbierto: DemoTurno | undefined;
  ultimoTurno: DemoTurno | undefined;
  resumen: ResumenTurnoDemo | undefined;
  diaCerrado: boolean;
}

const formatoMoneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });
const formatoFecha = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
});

@Component({
  selector: 'app-cajas-turnos-page',
  imports: [Icon],
  templateUrl: './cajas-turnos-page.html',
  providers: [CajasTurnosDemoStore],
  host: { class: 'block min-w-0' },
})
export default class CajasTurnosPage {
  readonly store = inject(CajasTurnosDemoStore);
  readonly filtro = signal<FiltroCajas>('todas');
  readonly busqueda = signal('');
  readonly fechaVisible = computed(() => formatoFecha.format(new Date(`${this.store.fechaOperativa()}T12:00:00Z`)));

  readonly cajasVisibles = computed<CajaVisible[]>(() => {
    const { cajas, turnos, ventas, movimientos } = this.store.datos();
    const fecha = this.store.fechaOperativa();
    const termino = this.busqueda().trim().toLocaleLowerCase('es');
    return cajas.filter((caja) => caja.activo)
      .map((caja) => {
        const delDia = turnos.filter((turno) => turno.cajaId === caja.id && turno.fechaOperativa === fecha)
          .sort((a, b) => a.numero - b.numero);
        const ultimoTurno = delDia.at(-1);
        const turnoAbierto = delDia.find((turno) => turno.fechaCierre === null);
        return {
          caja, turnoAbierto, ultimoTurno,
          resumen: ultimoTurno ? resumenTurno(ultimoTurno, ventas, movimientos) : undefined,
          diaCerrado: ultimoTurno?.tipoCierre === 'dia',
        };
      })
      .filter(({ caja, turnoAbierto }) => {
        const coincide = `${caja.codigo} ${caja.nombre}`.toLocaleLowerCase('es').includes(termino);
        return coincide && (this.filtro() === 'todas' || (this.filtro() === 'abiertas' ? !!turnoAbierto : !turnoAbierto));
      })
      .sort((a, b) => Number(!!b.turnoAbierto) - Number(!!a.turnoAbierto)
        || a.caja.codigo.localeCompare(b.caja.codigo, 'es'));
  });

  readonly cajasCerradas = computed(() => this.store.datos().cajas.filter((caja) => caja.activo).length - this.store.cajasAbiertas());

  moneda(centavos: number): string {
    return formatoMoneda.format(centavos / 100);
  }

  cambiarFiltro(filtro: FiltroCajas): void {
    this.filtro.set(filtro);
  }
}
