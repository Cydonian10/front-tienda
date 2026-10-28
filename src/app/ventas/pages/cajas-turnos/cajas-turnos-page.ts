import { Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { ActividadRecienteCaja } from './components/actividad-reciente';
import { resumenTurno } from '../../demo/cajas-turnos-demo-calculos';
import { CajasTurnosDemoStore } from '../../demo/cajas-turnos-demo.store';
import type { DemoCaja, DemoTurno, ResumenTurnoDemo, TipoMovimientoDemo } from '../../demo/cajas-turnos-demo.models';

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

/** No convierte a coma flotante importes que se guardarán en céntimos. */
export function parsearCentavos(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^(0|[1-9]\d*)(?:[.,](\d{1,2}))?$/.test(limpio)) return null;
  const [entero, decimal = ''] = limpio.replace(',', '.').split('.');
  const resultado = Number(entero) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(resultado) ? resultado : null;
}

@Component({
  selector: 'app-cajas-turnos-page',
  imports: [Icon, ActividadRecienteCaja],
  templateUrl: './cajas-turnos-page.html',
  providers: [CajasTurnosDemoStore],
  host: { class: 'block min-w-0' },
})
export default class CajasTurnosPage {
  readonly store = inject(CajasTurnosDemoStore);
  readonly filtro = signal<FiltroCajas>('todas');
  readonly busqueda = signal('');
  readonly mostrarCrearCaja = signal(false);
  readonly nombreCaja = signal('');
  readonly errorCaja = signal('');
  readonly cajaAperturaId = signal<string | null>(null);
  readonly saldoInicial = signal('');
  readonly errorApertura = signal('');
  readonly cajaMovimientoId = signal<string | null>(null);
  readonly tipoMovimiento = signal<TipoMovimientoDemo>('ingreso');
  readonly importeMovimiento = signal('');
  readonly motivoMovimiento = signal('');
  readonly errorMovimiento = signal('');
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

  alternarCrearCaja(): void {
    this.mostrarCrearCaja.update((visible) => !visible);
    this.nombreCaja.set('');
    this.errorCaja.set('');
  }

  crearCaja(evento: Event): void {
    evento.preventDefault();
    try {
      this.store.crearCaja(this.nombreCaja());
      this.mostrarCrearCaja.set(false);
      this.nombreCaja.set('');
      this.errorCaja.set('');
      this.busqueda.set('');
      this.filtro.set('todas');
    } catch (error) {
      this.errorCaja.set((error as Error).message);
    }
  }

  alternarApertura(cajaId: string): void {
    this.cajaAperturaId.set(this.cajaAperturaId() === cajaId ? null : cajaId);
    this.saldoInicial.set('');
    this.errorApertura.set('');
  }

  abrirTurno(evento: Event, cajaId: string): void {
    evento.preventDefault();
    try {
      const saldoHeredado = this.store.saldoSiguiente(cajaId);
      const saldo = saldoHeredado === null ? parsearCentavos(this.saldoInicial()) : undefined;
      if (saldoHeredado === null && saldo === null) {
        this.errorApertura.set('Ingresa un saldo inicial válido con hasta dos decimales.');
        return;
      }
      this.store.abrirTurno(cajaId, saldo ?? undefined);
      this.cajaAperturaId.set(null);
      this.errorApertura.set('');
    } catch (error) {
      this.errorApertura.set((error as Error).message);
    }
  }

  alternarMovimiento(cajaId: string): void {
    this.cajaMovimientoId.set(this.cajaMovimientoId() === cajaId ? null : cajaId);
    this.tipoMovimiento.set('ingreso');
    this.importeMovimiento.set('');
    this.motivoMovimiento.set('');
    this.errorMovimiento.set('');
  }

  registrarMovimiento(evento: Event, cajaId: string): void {
    evento.preventDefault();
    const centavos = parsearCentavos(this.importeMovimiento());
    if (centavos === null || centavos <= 0) {
      this.errorMovimiento.set('Ingresa un importe mayor que S/ 0.00 con hasta dos decimales.');
      return;
    }
    try {
      this.store.registrarMovimiento(cajaId, this.tipoMovimiento(), centavos, this.motivoMovimiento());
      this.cajaMovimientoId.set(null);
      this.errorMovimiento.set('');
    } catch (error) {
      this.errorMovimiento.set((error as Error).message);
    }
  }
}
