export interface FilaMovimiento {
  id: number;
  varianteId: string;
  unidadId: string;
  cantidad: string;
  costoUnitarioBase: string;
}

export function nuevaFilaMovimiento(id: number): FilaMovimiento {
  return { id, varianteId: '', unidadId: '', cantidad: '', costoUnitarioBase: '' };
}
