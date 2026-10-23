/** Datos exclusivos de demostración; no representan movimientos registrados en la API. */
export type TipoMovimientoHistorial = 'ingreso' | 'salida' | 'traslado' | 'ajuste';
export type FiltroTipoHistorial = TipoMovimientoHistorial | 'todos';

const ETIQUETAS_TIPO: Record<TipoMovimientoHistorial, string> = {
  ingreso: 'Ingreso',
  salida: 'Salida',
  traslado: 'Traslado',
  ajuste: 'Ajuste',
};

export function etiquetaTipoHistorial(tipo: TipoMovimientoHistorial): string {
  return ETIQUETAS_TIPO[tipo];
}

export interface DetalleHistorialDemo {
  producto: string;
  sku: string;
  cantidad: string;
  unidad: string;
  factorABase: string;
  cantidadBase: string;
  /** Costo en PEN por unidad base aplicado al movimiento. */
  costoAplicado: string;
}

export interface MovimientoHistorialDemo {
  id: string;
  fecha: string;
  tipo: TipoMovimientoHistorial;
  estado: 'confirmado';
  usuario: string;
  almacenOrigen: string | null;
  almacenDestino: string | null;
  motivo: string;
  /** Valor absoluto en PEN a costo; el tipo y el signo de las líneas expresan el efecto. */
  valorCosto: string;
  detalles: readonly DetalleHistorialDemo[];
}

export const MOVIMIENTOS_HISTORIAL_DEMO: readonly MovimientoHistorialDemo[] = [
  {
    id: 'MOV-2026-010',
    fecha: '2026-10-21T15:40:00-05:00',
    tipo: 'traslado',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: 'Almacén principal',
    almacenDestino: 'Sucursal norte',
    motivo: 'Reposición de stock en sucursal',
    valorCosto: '154.00',
    detalles: [
      {
        producto: 'Taladro percutor 650 W',
        sku: 'TAL-650',
        cantidad: '2',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '2',
        costoAplicado: '77.00',
      },
    ],
  },
  {
    id: 'MOV-2026-009',
    fecha: '2026-10-21T10:20:00-05:00',
    tipo: 'salida',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: 'Almacén principal',
    almacenDestino: null,
    motivo: 'Entrega interna para mantenimiento',
    valorCosto: '45.00',
    detalles: [
      {
        producto: 'Brocha profesional 3 in',
        sku: 'BRO-3P',
        cantidad: '5',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '5',
        costoAplicado: '9.00',
      },
    ],
  },
  {
    id: 'MOV-2026-008',
    fecha: '2026-10-20T16:15:00-05:00',
    tipo: 'ingreso',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: null,
    almacenDestino: 'Almacén principal',
    motivo: 'Ingreso por compra de demostración',
    valorCosto: '120.00',
    detalles: [
      {
        producto: 'Tornillo galvanizado 2 in',
        sku: 'TOR-GAL-2',
        cantidad: '2',
        unidad: 'caja',
        factorABase: '100',
        cantidadBase: '200',
        costoAplicado: '0.60',
      },
    ],
  },
  {
    id: 'MOV-2026-007',
    fecha: '2026-10-20T09:05:00-05:00',
    tipo: 'ajuste',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: null,
    almacenDestino: 'Sucursal norte',
    motivo: 'Conteo físico: unidades encontradas',
    valorCosto: '24.00',
    detalles: [
      {
        producto: 'Cinta aislante negra',
        sku: 'CIN-NEG',
        cantidad: '4',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '4',
        costoAplicado: '6.00',
      },
    ],
  },
  {
    id: 'MOV-2026-006',
    fecha: '2026-10-19T14:30:00-05:00',
    tipo: 'traslado',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: 'Sucursal norte',
    almacenDestino: 'Almacén principal',
    motivo: 'Redistribución entre almacenes',
    valorCosto: '90.00',
    detalles: [
      {
        producto: 'Pintura látex blanca 1 gal',
        sku: 'PIN-BLA-1G',
        cantidad: '2',
        unidad: 'galón',
        factorABase: '1',
        cantidadBase: '2',
        costoAplicado: '45.00',
      },
    ],
  },
  {
    id: 'MOV-2026-005',
    fecha: '2026-10-19T11:10:00-05:00',
    tipo: 'ajuste',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: null,
    almacenDestino: 'Almacén principal',
    motivo: 'Conteo físico: unidades faltantes',
    valorCosto: '18.00',
    detalles: [
      {
        producto: 'Cinta aislante negra',
        sku: 'CIN-NEG',
        cantidad: '-3',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '-3',
        costoAplicado: '6.00',
      },
    ],
  },
  {
    id: 'MOV-2026-004',
    fecha: '2026-10-18T12:45:00-05:00',
    tipo: 'salida',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: 'Sucursal norte',
    almacenDestino: null,
    motivo: 'Consumo de materiales en taller',
    valorCosto: '36.00',
    detalles: [
      {
        producto: 'Brocha profesional 3 in',
        sku: 'BRO-3P',
        cantidad: '4',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '4',
        costoAplicado: '9.00',
      },
    ],
  },
  {
    id: 'MOV-2026-003',
    fecha: '2026-10-17T17:25:00-05:00',
    tipo: 'ingreso',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: null,
    almacenDestino: 'Sucursal norte',
    motivo: 'Ingreso por compra de demostración',
    valorCosto: '231.00',
    detalles: [
      {
        producto: 'Taladro percutor 650 W',
        sku: 'TAL-650',
        cantidad: '3',
        unidad: 'unidad',
        factorABase: '1',
        cantidadBase: '3',
        costoAplicado: '77.00',
      },
    ],
  },
  {
    id: 'MOV-2026-002',
    fecha: '2026-10-16T08:40:00-05:00',
    tipo: 'salida',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: 'Almacén principal',
    almacenDestino: null,
    motivo: 'Materiales para montaje',
    valorCosto: '60.00',
    detalles: [
      {
        producto: 'Tornillo galvanizado 2 in',
        sku: 'TOR-GAL-2',
        cantidad: '1',
        unidad: 'caja',
        factorABase: '100',
        cantidadBase: '100',
        costoAplicado: '0.60',
      },
    ],
  },
  {
    id: 'MOV-2026-001',
    fecha: '2026-10-15T09:00:00-05:00',
    tipo: 'ingreso',
    estado: 'confirmado',
    usuario: 'Operador demo',
    almacenOrigen: null,
    almacenDestino: 'Almacén principal',
    motivo: 'Ingreso por compra de demostración',
    valorCosto: '180.00',
    detalles: [
      {
        producto: 'Pintura látex blanca 1 gal',
        sku: 'PIN-BLA-1G',
        cantidad: '4',
        unidad: 'galón',
        factorABase: '1',
        cantidadBase: '4',
        costoAplicado: '45.00',
      },
    ],
  },
];

function textoBusqueda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-PE')
    .trim();
}

export function filtrarMovimientosHistorial(
  movimientos: readonly MovimientoHistorialDemo[],
  busqueda: string,
  tipo: FiltroTipoHistorial,
): MovimientoHistorialDemo[] {
  const termino = textoBusqueda(busqueda);
  return movimientos
    .filter(
      (movimiento) =>
        (tipo === 'todos' || movimiento.tipo === tipo) &&
        (!termino ||
          [
            movimiento.id,
            movimiento.almacenOrigen ?? '',
            movimiento.almacenDestino ?? '',
            ...movimiento.detalles.flatMap((detalle) => [detalle.producto, detalle.sku]),
          ].some((valor) => textoBusqueda(valor).includes(termino))),
    )
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}
