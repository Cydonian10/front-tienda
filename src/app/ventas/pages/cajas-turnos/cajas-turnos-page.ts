import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject, Injector, signal } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';
import { ActividadRecienteCaja } from './components/actividad-reciente';
import { parsearCentavos, reporteCaja, resumenTurno } from '../../demo/cajas-turnos-demo-calculos';
import { CierreTurnoDialog } from './components/cierre-turno-dialog';
import { ReporteCaja } from './components/reporte-caja';
import { CajasTurnosDemoStore } from '../../demo/cajas-turnos-demo.store';
import type { DemoCaja, DemoTurno, ResumenTurnoDemo, TipoCierreDemo, TipoMovimientoDemo } from '../../demo/cajas-turnos-demo.models';

export { parsearCentavos } from '../../demo/cajas-turnos-demo-calculos';

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
  imports: [Icon, ActividadRecienteCaja, CierreTurnoDialog, ReporteCaja],
  templateUrl: './cajas-turnos-page.html',
  providers: [CajasTurnosDemoStore],
  host: { class: 'block min-w-0' },
})
export default class CajasTurnosPage {
  readonly store = inject(CajasTurnosDemoStore);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
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
  readonly cierreCajaId = signal<string | null>(null);
  readonly tipoCierre = signal<TipoCierreDemo>('turno');
  readonly errorCierre = signal('');
  readonly reporteSeleccion = signal<{ cajaId: string; fechaOperativa: string } | null>(null);
  readonly errorFecha = signal('');
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
  readonly cierreActivo = computed(() => {
    const cajaId = this.cierreCajaId();
    if (!cajaId) return null;
    const datos = this.store.datos();
    const caja = datos.cajas.find((item) => item.id === cajaId);
    const turno = datos.turnos.find((item) => item.cajaId === cajaId && item.fechaCierre === null
      && item.fechaOperativa === this.store.fechaOperativa());
    return caja && turno ? { caja, turno, resumen: resumenTurno(turno, datos.ventas, datos.movimientos) } : null;
  });
  readonly reporteVisible = computed(() => {
    const seleccion = this.reporteSeleccion();
    return seleccion ? reporteCaja(this.store.datos(), seleccion.cajaId, seleccion.fechaOperativa) : null;
  });

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

  abrirCierre(cajaId: string, tipo: TipoCierreDemo): void {
    if (!this.store.turnoAbierto(cajaId)) return;
    this.tipoCierre.set(tipo);
    this.errorCierre.set('');
    this.cierreCajaId.set(cajaId);
  }

  cancelarCierre(): void {
    this.cierreCajaId.set(null);
    this.errorCierre.set('');
  }

  confirmarCierre(datos: { contadoCentavos: number; observacion: string }): void {
    const cajaId = this.cierreCajaId();
    if (!cajaId) return;
    try {
      this.store.cerrarTurno(cajaId, this.tipoCierre(), datos.contadoCentavos, datos.observacion);
      this.cancelarCierre();
      this.cajaMovimientoId.set(null);
    } catch (error) {
      this.errorCierre.set((error as Error).message);
    }
  }

  fechasAnteriores(cajaId: string): string[] {
    return [...new Set(this.store.datos().turnos.filter((turno) =>
      turno.cajaId === cajaId && turno.fechaOperativa !== this.store.fechaOperativa())
      .map((turno) => turno.fechaOperativa))].sort().reverse();
  }

  verReporte(cajaId: string, fechaOperativa: string): void {
    if (!reporteCaja(this.store.datos(), cajaId, fechaOperativa)) return;
    this.reporteSeleccion.set({ cajaId, fechaOperativa });
    afterNextRender(() => this.document.getElementById('reporte-caja')?.focus(), { injector: this.injector });
  }

  avanzarDia(): void {
    try {
      this.store.avanzarDia();
      this.busqueda.set('');
      this.filtro.set('todas');
      this.errorFecha.set('');
    } catch (error) {
      this.errorFecha.set((error as Error).message);
    }
  }
}
