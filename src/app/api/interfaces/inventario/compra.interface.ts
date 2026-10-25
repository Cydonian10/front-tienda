export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ProveedorResponse {
  id: string;
  nombre: string;
  documento: string | null;
  contacto: string | null;
}

export interface UnidadCompraResponse {
  id: string;
  nombre: string;
  simbolo: string;
  factorABase: string;
}

export interface VarianteCompraResponse {
  id: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  unidadBase: UnidadCompraResponse;
  unidades: UnidadCompraResponse[];
}

export interface CompraListadoResponse {
  id: string;
  fecha: string;
  fechaRegistro: string;
  tipoDocumento: 'factura' | 'boleta' | 'otro' | null;
  serieDocumento: string | null;
  numeroDocumento: string | null;
  totalDocumento: string | null;
  proveedor: Pick<ProveedorResponse, 'id' | 'nombre'>;
  almacen: { id: string; nombre: string } | null;
  cantidadRenglones: number;
}

export interface RenglonCompraResponse {
  id: string;
  varianteId: string;
  productoNombre: string;
  sku: string;
  unidadId: string;
  unidadNombre: string;
  unidadSimbolo: string;
  cantidad: string;
  factorABase: string;
  precioUnitario: string;
}

export interface ComprobanteCompraResponse {
  id: string;
  nombreOriginal: string;
  tipoMime: string;
  tamanoBytes: number;
  fechaSubida: string;
}

export interface CompraResponse extends CompraListadoResponse {
  revision: number;
  observaciones: string | null;
  ingreso: { id: string; fecha: string; estado: 'confirmado' | 'borrador' | 'anulado' } | null;
  renglones: RenglonCompraResponse[];
  comprobante: ComprobanteCompraResponse | null;
}

export interface CorreccionCompra {
  revision: number;
  tipoDocumento: 'factura' | 'boleta' | 'otro';
  fecha: string;
  serieDocumento: string;
  numeroDocumento: string;
  observaciones: string;
  precios: { renglonId: string; precioUnitario: string }[];
}

export interface CrearCompraResponse {
  id: string;
  comprobante: { estado: 'adjuntado' | 'pendiente' | 'fallido'; advertencia?: string };
}

export interface RenglonNuevaCompra {
  varianteId: string;
  unidadId: string;
  cantidad: string;
  precioUnitario: string;
}

export interface NuevaCompra {
  proveedorId: string;
  almacenId: string;
  tipoDocumento: 'factura' | 'boleta' | 'otro';
  fecha: string;
  serieDocumento: string;
  numeroDocumento: string;
  observaciones?: string;
  renglones: RenglonNuevaCompra[];
  comprobante: File | null;
}
