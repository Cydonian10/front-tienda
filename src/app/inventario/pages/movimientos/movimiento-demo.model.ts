/** Datos exclusivamente de demostración. Ninguna operación modifica la API ni el stock real. */
export type TipoMovimiento = 'salida' | 'traslado' | 'ajuste';

export interface VarianteDemo {
  id: string;
  nombre: string;
  sku: string;
  unidad: string;
  stock: Readonly<Record<string, number>>;
  costo: number;
}

export interface DetalleDemo {
  id: number;
  varianteId: string;
  cantidad: string;
  unidad: 'base' | 'caja';
  costo: string;
}

export const ALMACENES_DEMO = [
  { id: 'principal', nombre: 'Almacén principal' },
  { id: 'centro', nombre: 'Tienda Centro' },
] as const;

export const VARIANTES_DEMO: readonly VarianteDemo[] = [
  {
    id: 'martillo',
    nombre: 'Martillo de uña 16 oz',
    sku: 'MAR-UNA-16',
    unidad: 'und',
    stock: { principal: 48, centro: 12 },
    costo: 28.5,
  },
  {
    id: 'tornillo',
    nombre: 'Tornillo hexagonal M8',
    sku: 'TOR-HEX-M8',
    unidad: 'und',
    stock: { principal: 260, centro: 75 },
    costo: 0.65,
  },
  {
    id: 'pintura',
    nombre: 'Pintura látex blanca 1 gal',
    sku: 'PIN-LAT-BLA',
    unidad: 'gal',
    stock: { principal: 32, centro: 8 },
    costo: 46,
  },
  {
    id: 'cinta',
    nombre: 'Cinta aislante negra',
    sku: 'CIN-AIS-NEG',
    unidad: 'und',
    stock: { principal: 90, centro: 24 },
    costo: 3.8,
  },
];

export function cantidadBase(detalle: DetalleDemo): number {
  const cantidad = Number(detalle.cantidad);
  return cantidad * (detalle.unidad === 'caja' ? 10 : 1);
}

export function validarMovimiento(
  tipo: TipoMovimiento,
  origen: string,
  destino: string,
  motivo: string,
  detalles: readonly DetalleDemo[],
): string | null {
  if (!ALMACENES_DEMO.some((almacen) => almacen.id === origen))
    return 'Selecciona un almacén válido.';
  if (
    tipo === 'traslado' &&
    (!ALMACENES_DEMO.some((almacen) => almacen.id === destino) || origen === destino)
  ) {
    return 'Elige un destino diferente del almacén de origen.';
  }
  if (tipo === 'ajuste' && !motivo.trim()) return 'Indica el motivo del ajuste.';
  if (!detalles.length) return 'Añade al menos una variante.';

  const salidas = new Map<string, number>();
  for (const detalle of detalles) {
    const variante = VARIANTES_DEMO.find((item) => item.id === detalle.varianteId);
    if (!variante) return 'Selecciona una variante en cada fila.';
    if (
      !/^-?\d+(?:\.\d{1,2})?$/.test(detalle.cantidad) ||
      !Number.isFinite(Number(detalle.cantidad)) ||
      Number(detalle.cantidad) === 0 ||
      (tipo !== 'ajuste' && Number(detalle.cantidad) < 0)
    ) {
      return `Revisa la cantidad de ${variante.nombre}: debe ser ${tipo === 'ajuste' ? 'distinta de cero' : 'mayor que cero'} y tener como máximo dos decimales.`;
    }
    if (
      tipo === 'ajuste' &&
      Number(detalle.cantidad) > 0 &&
      detalle.costo &&
      !/^(?:\d+)(?:\.\d{1,2})?$/.test(detalle.costo)
    ) {
      return `Revisa el costo asignado de ${variante.nombre}.`;
    }
    if (tipo !== 'ajuste' || cantidadBase(detalle) < 0) {
      salidas.set(variante.id, (salidas.get(variante.id) ?? 0) + Math.abs(cantidadBase(detalle)));
    }
  }
  for (const [id, total] of salidas) {
    const variante = VARIANTES_DEMO.find((item) => item.id === id)!;
    if (total > (variante.stock[origen] ?? 0)) {
      return `Stock de prueba insuficiente para ${variante.nombre} en el almacén de origen.`;
    }
  }
  return null;
}
