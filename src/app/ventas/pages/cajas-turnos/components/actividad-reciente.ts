import { Component, computed, input } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';
import type { DatosDemoCaja } from '../../../demo/cajas-turnos-demo.models';

interface EventoDemo {
  id: string;
  descripcion: string;
  caja: string;
  responsable: string;
  fecha: string;
  importeCentavos: number | null;
  tipo: 'apertura' | 'ingreso' | 'egreso' | 'cierre';
}

const horaLima = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' });
const moneda = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

@Component({
  selector: 'app-actividad-reciente-caja',
  imports: [Icon],
  templateUrl: './actividad-reciente.html',
})
export class ActividadRecienteCaja {
  readonly datos = input.required<DatosDemoCaja>();
  readonly fechaOperativa = input.required<string>();

  readonly eventos = computed<EventoDemo[]>(() => {
    const { cajas, turnos, movimientos } = this.datos();
    const turnosDelDia = turnos.filter((turno) => turno.fechaOperativa === this.fechaOperativa());
    const cajaPorId = new Map(cajas.map((caja) => [caja.id, caja.nombre]));
    const turnoPorId = new Map(turnosDelDia.map((turno) => [turno.id, turno]));
    const aperturas: EventoDemo[] = turnosDelDia.map((turno) => ({
      id: `abrir-${turno.id}`, descripcion: `Apertura · Turno #${turno.numero}`,
      caja: cajaPorId.get(turno.cajaId) ?? 'Caja', responsable: turno.responsableApertura,
      fecha: turno.fechaApertura, importeCentavos: turno.saldoInicialCentavos, tipo: 'apertura',
    }));
    const cierres: EventoDemo[] = turnosDelDia.filter((turno) => turno.fechaCierre).map((turno) => ({
      id: `cerrar-${turno.id}`, descripcion: `${turno.tipoCierre === 'dia' ? 'Cierre del día' : 'Cierre de turno'} · Turno #${turno.numero}`,
      caja: cajaPorId.get(turno.cajaId) ?? 'Caja', responsable: turno.responsableCierre ?? 'Operador demo',
      fecha: turno.fechaCierre!, importeCentavos: turno.efectivoContadoCentavos, tipo: 'cierre',
    }));
    const manuales: EventoDemo[] = movimientos.filter((movimiento) => turnoPorId.has(movimiento.turnoId))
      .map((movimiento) => ({
        id: movimiento.id, descripcion: movimiento.motivo,
        caja: cajaPorId.get(turnoPorId.get(movimiento.turnoId)!.cajaId) ?? 'Caja',
        responsable: movimiento.responsable, fecha: movimiento.fecha,
        importeCentavos: movimiento.importeCentavos, tipo: movimiento.tipo,
      }));
    return [...aperturas, ...cierres, ...manuales]
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id)).slice(0, 8);
  });

  hora(fecha: string): string {
    return horaLima.format(new Date(fecha));
  }

  importe(centavos: number): string {
    return moneda.format(centavos / 100);
  }
}
