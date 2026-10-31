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
