import type { DatosDemoCaja, DemoTurno } from './cajas-turnos-demo.models';

/** Fecha operativa de la tienda, independiente de la zona horaria del navegador. */
export function fechaOperativaLima(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(ahora);
  const campo = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
  return `${campo('year')}-${campo('month')}-${campo('day')}`;
}

/** Avanza un día calendario sin sumar 24 horas a una hora local. */
export function siguienteFechaOperativa(fecha: string): string {
  const [year, month, day] = fecha.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function datosInicialesCaja(fechaOperativa: string): DatosDemoCaja {
  // Horas locales de Lima representadas como instantes ISO para ordenar la actividad.
  const instante = (hora: string) => `${fechaOperativa}T${hora}-05:00`;
  const turnos: DemoTurno[] = [
    {
      id: 'demo-turno-principal-1', cajaId: 'demo-caja-1', numero: 1,
      fechaOperativa, fechaApertura: instante('09:00:00'), fechaCierre: null,
      saldoInicialCentavos: 5000, efectivoContadoCentavos: null,
      diferenciaCentavos: null, tipoCierre: null, observacion: null,
      responsableApertura: 'Operador demo', responsableCierre: null,
    },
    {
      id: 'demo-turno-secundaria-1', cajaId: 'demo-caja-2', numero: 1,
      fechaOperativa, fechaApertura: instante('08:00:00'), fechaCierre: instante('11:00:00'),
      saldoInicialCentavos: 5000, efectivoContadoCentavos: 8000,
      diferenciaCentavos: 0, tipoCierre: 'turno', observacion: null,
      responsableApertura: 'Operador demo', responsableCierre: 'Operador demo',
    },
    {
      id: 'demo-turno-secundaria-2', cajaId: 'demo-caja-2', numero: 2,
      fechaOperativa, fechaApertura: instante('11:05:00'), fechaCierre: instante('13:00:00'),
      saldoInicialCentavos: 8000, efectivoContadoCentavos: 8000,
      diferenciaCentavos: 0, tipoCierre: 'dia', observacion: null,
      responsableApertura: 'Operador demo', responsableCierre: 'Operador demo',
    },
  ];

  return {
    cajas: [
      { id: 'demo-caja-1', codigo: 'CJ-001', nombre: 'Caja principal', activo: true },
      { id: 'demo-caja-2', codigo: 'CJ-002', nombre: 'Caja secundaria', activo: true },
    ],
    turnos,
    ventas: [
      {
        id: 'demo-venta-1', turnoId: turnos[0].id, fecha: instante('10:30:00'),
        cobrosCentavos: { efectivo: 10000, yape: 0 },
        vueltosCentavos: { efectivo: 0, yape: 0 },
      },
      {
        id: 'demo-venta-2', turnoId: turnos[0].id, fecha: instante('10:45:00'),
        cobrosCentavos: { efectivo: 0, yape: 6800 },
        vueltosCentavos: { efectivo: 0, yape: 0 },
      },
    ],
    movimientos: [
      {
        id: 'demo-movimiento-1', turnoId: turnos[0].id, tipo: 'ingreso',
        importeCentavos: 2000, motivo: 'Cambio para caja', responsable: 'Operador demo',
        fecha: instante('10:50:00'),
      },
      {
        id: 'demo-movimiento-2', turnoId: turnos[0].id, tipo: 'egreso',
        importeCentavos: 1000, motivo: 'Gasto menor', responsable: 'Operador demo',
        fecha: instante('10:55:00'),
      },
      {
        id: 'demo-movimiento-3', turnoId: turnos[1].id, tipo: 'ingreso',
        importeCentavos: 3000, motivo: 'Cambio para caja', responsable: 'Operador demo',
        fecha: instante('09:00:00'),
      },
    ],
  };
}
