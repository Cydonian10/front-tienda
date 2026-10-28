import { datosInicialesCaja, fechaOperativaLima, siguienteFechaOperativa } from './cajas-turnos-demo-data';
import { diaCerrado, reporteCaja, resumenDia, resumenTurno, saldoSiguienteTurno, turnosCajaDia } from './cajas-turnos-demo-calculos';

describe('datos y cálculos de cajas de prueba', () => {
  const fecha = '2026-10-27';

  it('separa el Yape del efectivo y no duplica cobros como movimientos', () => {
    const datos = datosInicialesCaja(fecha);
    const principal = resumenTurno(datos.turnos[0], datos.ventas, datos.movimientos);
    expect(principal).toMatchObject({
      saldoInicialCentavos: 5000, cobrosEfectivoCentavos: 10000,
      cobrosYapeCentavos: 6800, ingresosCentavos: 2000, egresosCentavos: 1000,
      efectivoEsperadoCentavos: 16000,
    });
    expect(resumenDia(fecha, datos)).toEqual({
      efectivoEnCajaCentavos: 16000, ventasEfectivoCentavos: 10000, ventasYapeCentavos: 6800,
    });
  });

  it('resta vuelto del medio correspondiente sin incluir el Yape en el efectivo físico', () => {
    const datos = datosInicialesCaja(fecha);
    const ventas = [{ ...datos.ventas[0], cobrosCentavos: { efectivo: 10000, yape: 200 }, vueltosCentavos: { efectivo: 500, yape: 100 } }];
    const resumen = resumenTurno(datos.turnos[0], ventas, datos.movimientos);
    expect(resumen.ventasEfectivoCentavos).toBe(9500);
    expect(resumen.ventasYapeCentavos).toBe(100);
    expect(resumen.efectivoEsperadoCentavos).toBe(15500);
  });

  it('traslada el efectivo contado al siguiente turno y distingue el cierre de día', () => {
    const datos = datosInicialesCaja(fecha);
    const turnos = turnosCajaDia(datos.turnos, 'demo-caja-2', fecha);
    expect(turnos).toHaveLength(2);
    expect(resumenTurno(turnos[0], datos.ventas, datos.movimientos).efectivoEsperadoCentavos).toBe(8000);
    expect(turnos[1].saldoInicialCentavos).toBe(turnos[0].efectivoContadoCentavos);
    expect(saldoSiguienteTurno([turnos[0]], 'demo-caja-2', fecha)).toBe(8000);
    expect(diaCerrado(datos.turnos, 'demo-caja-2', fecha)).toBe(true);
    expect(diaCerrado(datos.turnos, 'demo-caja-1', fecha)).toBe(false);
    expect(saldoSiguienteTurno(datos.turnos, 'demo-caja-2', siguienteFechaOperativa(fecha))).toBeNull();
  });

  it('usa el día de Lima y avanza por calendario incluso en fin de mes y año bisiesto', () => {
    expect(fechaOperativaLima(new Date('2026-10-27T03:00:00Z'))).toBe('2026-10-26');
    expect(fechaOperativaLima(new Date('2026-10-27T05:00:00Z'))).toBe('2026-10-27');
    expect(siguienteFechaOperativa('2026-12-31')).toBe('2027-01-01');
    expect(siguienteFechaOperativa('2028-02-28')).toBe('2028-02-29');
  });

  it('consolida varios turnos sin duplicar el saldo trasladado', () => {
    const datos = datosInicialesCaja(fecha);
    const cerrado = reporteCaja(datos, 'demo-caja-2', fecha)!;
    expect(cerrado.estado).toBe('final');
    expect(cerrado.turnos).toHaveLength(2);
    expect(cerrado.totales).toMatchObject({
      saldoInicialCentavos: 5000, ingresosCentavos: 3000,
      efectivoEsperadoUltimoCentavos: 8000, efectivoContadoUltimoCentavos: 8000,
    });
    expect(cerrado.totales.saldoInicialCentavos + cerrado.totales.ingresosCentavos).toBe(8000);
    expect(reporteCaja(datos, 'demo-caja-1', fecha)?.estado).toBe('provisional');
    expect(reporteCaja(datos, 'demo-caja-1', fecha)?.totales.efectivoContadoUltimoCentavos).toBeNull();
    expect(reporteCaja(datos, 'demo-caja-1', siguienteFechaOperativa(fecha))).toBeNull();
  });
});
