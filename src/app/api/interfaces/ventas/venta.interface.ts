export type MedioPagoVenta = 'efectivo' | 'yape';

export interface DetalleCrearVenta {
  readonly varianteId: string;
  readonly unidadId: string;
  readonly cantidad: string;
}

export interface PagoCrearVenta {
  readonly medio: MedioPagoVenta;
  readonly importe: string;
}

export interface CrearVentaDto {
  readonly turnoId: string;
  readonly almacenId: string;
  readonly detalles: readonly DetalleCrearVenta[];
  readonly pagos: readonly [PagoCrearVenta];
}

export interface DetalleVentaCreada {
  id: string;
  varianteId: string;
  unidadId: string;
  cantidad: string;
  factorABase: string;
  cantidadBase: string;
  precioUnitario: string;
  subtotal: string;
  descuentoPromocional: string;
  descuentoManual: string;
  total: string;
}

export interface PagoVentaCreada {
  id: string;
  medio: MedioPagoVenta;
  importe: string;
  fecha: string;
}

export interface VueltoVentaCreada {
  id: string;
  medio: 'efectivo';
  importe: string;
  fecha: string;
}

export interface VentaCreada {
  id: string;
  fecha: string;
  estado: 'confirmada';
  turnoId: string;
  almacenId: string;
  usuarioId: string;
  subtotal: string;
  descuentoPromocional: string;
  descuentoManual: string;
  baseImponible: string;
  igv: string;
  total: string;
  detalles: DetalleVentaCreada[];
  pagos: PagoVentaCreada[];
  vuelto: VueltoVentaCreada | null;
}
