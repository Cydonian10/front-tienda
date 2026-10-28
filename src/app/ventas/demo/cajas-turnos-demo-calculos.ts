import type {
  DatosDemoCaja, DemoMovimientoCaja, DemoTurno, DemoVenta, ResumenDiaDemo, ResumenTurnoDemo,
} from './cajas-turnos-demo.models';

/** Convierte a céntimos sin redondear importes escritos con más de dos decimales. */
export function parsearCentavos(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^(0|[1-9]\d*)(?:[.,](\d{1,2}))?$/.test(limpio)) return null;
  const [entero, decimal = ''] = limpio.replace(',', '.').split('.');
  const resultado = Number(entero) * 100 + Number(decimal.padEnd(2, '0'));
  return Number.isSafeInteger(resultado) ? resultado : null;
}

export function resumenTurno(
  turno: DemoTurno,
  ventas: readonly DemoVenta[],
  movimientos: readonly DemoMovimientoCaja[],
): ResumenTurnoDemo {
  const ventasDelTurno = ventas.filter((venta) => venta.turnoId === turno.id);
  const movimientosDelTurno = movimientos.filter((movimiento) => movimiento.turnoId === turno.id);
  const cobrosEfectivoCentavos = ventasDelTurno.reduce((total, venta) => total + venta.cobrosCentavos.efectivo, 0);
  const vueltosEfectivoCentavos = ventasDelTurno.reduce((total, venta) => total + venta.vueltosCentavos.efectivo, 0);
  const cobrosYapeCentavos = ventasDelTurno.reduce((total, venta) => total + venta.cobrosCentavos.yape, 0);
  const vueltosYapeCentavos = ventasDelTurno.reduce((total, venta) => total + venta.vueltosCentavos.yape, 0);
  const ingresosCentavos = movimientosDelTurno.reduce((total, movimiento) => total + (movimiento.tipo === 'ingreso' ? movimiento.importeCentavos : 0), 0);
  const egresosCentavos = movimientosDelTurno.reduce((total, movimiento) => total + (movimiento.tipo === 'egreso' ? movimiento.importeCentavos : 0), 0);
  // La demo no genera reintegros; el desglose conserva su lugar en el cuadre.
  const reintegrosEfectivoCentavos = 0;
  return {
    saldoInicialCentavos: turno.saldoInicialCentavos,
    cobrosEfectivoCentavos,
    vueltosEfectivoCentavos,
    ventasEfectivoCentavos: cobrosEfectivoCentavos - vueltosEfectivoCentavos,
    cobrosYapeCentavos,
    vueltosYapeCentavos,
    ventasYapeCentavos: cobrosYapeCentavos - vueltosYapeCentavos,
    ingresosCentavos,
    egresosCentavos,
    reintegrosEfectivoCentavos,
    efectivoEsperadoCentavos: turno.saldoInicialCentavos + cobrosEfectivoCentavos
      - vueltosEfectivoCentavos + ingresosCentavos - egresosCentavos - reintegrosEfectivoCentavos,
  };
}

export function resumenDia(fechaOperativa: string, datos: DatosDemoCaja): ResumenDiaDemo {
  return datos.turnos.filter((turno) => turno.fechaOperativa === fechaOperativa)
    .reduce((total, turno) => {
      const resumen = resumenTurno(turno, datos.ventas, datos.movimientos);
      return {
        efectivoEnCajaCentavos: total.efectivoEnCajaCentavos
          + (turno.fechaCierre === null ? resumen.efectivoEsperadoCentavos : 0),
        ventasEfectivoCentavos: total.ventasEfectivoCentavos + resumen.ventasEfectivoCentavos,
        ventasYapeCentavos: total.ventasYapeCentavos + resumen.ventasYapeCentavos,
      };
    }, { efectivoEnCajaCentavos: 0, ventasEfectivoCentavos: 0, ventasYapeCentavos: 0 });
}

export function turnosCajaDia(turnos: readonly DemoTurno[], cajaId: string, fechaOperativa: string): DemoTurno[] {
  return turnos.filter((turno) => turno.cajaId === cajaId && turno.fechaOperativa === fechaOperativa)
    .sort((a, b) => a.numero - b.numero);
}

export function diaCerrado(turnos: readonly DemoTurno[], cajaId: string, fechaOperativa: string): boolean {
  return turnosCajaDia(turnos, cajaId, fechaOperativa).some((turno) => turno.tipoCierre === 'dia');
}

/** null indica que el primer turno del día requiere un saldo introducido manualmente. */
export function saldoSiguienteTurno(turnos: readonly DemoTurno[], cajaId: string, fechaOperativa: string): number | null {
  const anteriores = turnosCajaDia(turnos, cajaId, fechaOperativa);
  return anteriores.length ? anteriores[anteriores.length - 1].efectivoContadoCentavos : null;
}
