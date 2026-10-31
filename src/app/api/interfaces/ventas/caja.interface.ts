export interface CrearCajaDto {
  nombre: string;
}

export interface Caja {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface FiltrarCajasDto {
  fechaOperativa?: string;
  estado?: 'activas' | 'inactivas' | 'todas';
}

export interface UsuarioTurno {
  id: string;
  nickName: string;
}

export interface TurnoCaja {
  id: string;
  usuarioApertura: UsuarioTurno;
  usuarioCierre: UsuarioTurno | null;
  fechaOperativa: string;
  fechaApertura: string;
  fechaCierre: string | null;
  saldoInicial: string;
  efectivoEsperado: string;
  efectivoContado: string | null;
  observacionCierre: string | null;
}

export interface CajaConTurnos extends Caja {
  turnos: TurnoCaja[];
}
