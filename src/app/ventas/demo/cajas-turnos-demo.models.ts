export type MedioPagoDemo = 'efectivo' | 'yape';
export type TipoCierreDemo = 'turno' | 'dia';
export type TipoMovimientoDemo = 'ingreso' | 'egreso';

export interface DemoCaja {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface DemoTurno {
  id: string;
  cajaId: string;
  numero: number;
  fechaOperativa: string;
  fechaApertura: string;
  fechaCierre: string | null;
  saldoInicialCentavos: number;
  efectivoContadoCentavos: number | null;
  diferenciaCentavos: number | null;
  tipoCierre: TipoCierreDemo | null;
  observacion: string | null;
  responsableApertura: string;
  responsableCierre: string | null;
}

export interface DemoMovimientoCaja {
  id: string;
  turnoId: string;
  tipo: TipoMovimientoDemo;
  importeCentavos: number;
  motivo: string;
  responsable: string;
  fecha: string;
}

export interface DemoVenta {
  id: string;
  turnoId: string;
  fecha: string;
  cobrosCentavos: Record<MedioPagoDemo, number>;
  vueltosCentavos: Record<MedioPagoDemo, number>;
}

export interface DatosDemoCaja {
  cajas: DemoCaja[];
  turnos: DemoTurno[];
  ventas: DemoVenta[];
  movimientos: DemoMovimientoCaja[];
}

export interface ResumenTurnoDemo {
  saldoInicialCentavos: number;
  cobrosEfectivoCentavos: number;
  vueltosEfectivoCentavos: number;
  ventasEfectivoCentavos: number;
  cobrosYapeCentavos: number;
  vueltosYapeCentavos: number;
  ventasYapeCentavos: number;
  ingresosCentavos: number;
  egresosCentavos: number;
  reintegrosEfectivoCentavos: number;
  efectivoEsperadoCentavos: number;
}

export interface ResumenDiaDemo {
  efectivoEnCajaCentavos: number;
  ventasEfectivoCentavos: number;
  ventasYapeCentavos: number;
}

export interface ReporteCajaDemo {
  caja: DemoCaja;
  fechaOperativa: string;
  estado: 'provisional' | 'final';
  turnos: { turno: DemoTurno; resumen: ResumenTurnoDemo }[];
  totales: {
    saldoInicialCentavos: number;
    cobrosEfectivoCentavos: number;
    vueltosEfectivoCentavos: number;
    ventasEfectivoCentavos: number;
    ventasYapeCentavos: number;
    ingresosCentavos: number;
    egresosCentavos: number;
    reintegrosEfectivoCentavos: number;
    diferenciasCentavos: number;
    efectivoEsperadoUltimoCentavos: number;
    efectivoContadoUltimoCentavos: number | null;
  };
}
