export interface AbrirTurnoDto {
  saldoInicial?: string;
}

export interface TurnoAbierto {
  id: string;
  cajaId: string;
  fechaOperativa: string;
  fechaApertura: string;
  saldoInicial: string;
}

export interface CerrarTurnoDto {
  efectivoContado: string;
  efectivoEsperadoConfirmado: string;
  observacionCierre?: string;
}

export interface ResumenTurno {
  id: string;
  cajaId: string;
  saldoInicial: string;
  cobrosEfectivo: string;
  vueltosEfectivo: string;
  ingresosManuales: string;
  egresosManuales: string;
  reintegrosEfectivo: string;
  efectivoEsperado: string;
}

export interface CierreTurnoResultado {
  id: string;
  cajaId: string;
  usuarioCierreId: string;
  fechaCierre: string;
  saldoInicial: string;
  efectivoEsperado: string;
  efectivoContado: string;
  diferencia: string;
  tipoCierre: string;
  observacionCierre: string | null;
}
