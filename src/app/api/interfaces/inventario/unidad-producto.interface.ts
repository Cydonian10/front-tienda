export interface UnidadProductoResponse {
  id: string;
  productoId: string;
  unidadId: string;
  factorABase: string;
}

export interface AgregarUnidadProductoDto {
  unidadId: string;
  factorABase: string;
}

export interface EditarUnidadProductoDto {
  factorABase: string;
}
