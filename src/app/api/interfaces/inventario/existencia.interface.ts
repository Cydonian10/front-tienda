export type DisponibilidadExistencias = 'todas' | 'con_stock' | 'sin_stock';

export interface AlmacenExistencia {
  id: string;
  nombre: string;
}

export interface UnidadExistencia {
  id: string;
  nombre: string;
  simbolo: string;
}

export interface UnidadSecundariaExistencia extends UnidadExistencia {
  factorABase: string;
}

export interface ProductoExistencia {
  id: string;
  nombre: string;
  marca: { id: string; nombre: string };
  activo: boolean;
  unidadBase: UnidadExistencia;
}

export interface ValorVarianteExistencia {
  atributoId: string;
  atributo: string;
  valor: string;
}

export interface VarianteExistencia {
  id: string;
  sku: string;
  activo: boolean;
  precioVenta: string;
  valores: ValorVarianteExistencia[];
}

export interface ExistenciaItem {
  producto: ProductoExistencia;
  variante: VarianteExistencia;
  almacen: AlmacenExistencia;
  /** Los valores decimales se conservan como cadenas exactas de la API. */
  cantidadBase: string;
  minimoBase: string | null;
  valorCosto: string;
  costoPromedioBase: string | null;
  costoRegistradoCero: boolean;
  unidadesSecundarias: UnidadSecundariaExistencia[];
}

export interface ListaExistenciasResponse {
  items: ExistenciaItem[];
  page: number;
  limit: number;
  totalItems: number;
  /** Total del alcance de almacén, independiente de filtros y paginación. */
  totalValorCosto: string;
}

export interface FiltroExistencias {
  almacenId: string;
  page: number;
  limit: number;
  q?: string;
  disponibilidad?: DisponibilidadExistencias;
}
