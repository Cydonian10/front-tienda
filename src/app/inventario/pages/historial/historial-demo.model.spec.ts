import { filtrarMovimientosHistorial, MOVIMIENTOS_HISTORIAL_DEMO } from './historial-demo.model';

describe('historial de demostración', () => {
  const movimientos = MOVIMIENTOS_HISTORIAL_DEMO;

  it('contiene entre 8 y 12 movimientos confirmados con IDs y fechas únicas', () => {
    expect(movimientos.length).toBeGreaterThanOrEqual(8);
    expect(movimientos.length).toBeLessThanOrEqual(12);
    expect(new Set(movimientos.map((movimiento) => movimiento.id)).size).toBe(movimientos.length);
    expect(new Set(movimientos.map((movimiento) => movimiento.fecha)).size).toBe(
      movimientos.length,
    );
    expect(movimientos.every((movimiento) => movimiento.estado === 'confirmado')).toBe(true);
    expect(new Set(movimientos.map((movimiento) => movimiento.tipo))).toEqual(
      new Set(['ingreso', 'salida', 'traslado', 'ajuste']),
    );
    expect(movimientos.every((movimiento) => movimiento.detalles.length > 0)).toBe(true);
  });

  it('conserva almacenes según el tipo y ajustes positivos y negativos', () => {
    for (const movimiento of movimientos) {
      if (movimiento.tipo === 'ingreso' || movimiento.tipo === 'ajuste') {
        expect(movimiento.almacenOrigen).toBeNull();
        expect(movimiento.almacenDestino).toBeTruthy();
      } else {
        expect(movimiento.almacenOrigen).toBeTruthy();
        if (movimiento.tipo === 'traslado') expect(movimiento.almacenDestino).toBeTruthy();
        else expect(movimiento.almacenDestino).toBeNull();
      }
    }
    const ajustes = movimientos.filter((movimiento) => movimiento.tipo === 'ajuste');
    expect(
      ajustes.some((movimiento) =>
        movimiento.detalles.some((detalle) => detalle.cantidad.startsWith('-')),
      ),
    ).toBe(true);
    expect(
      ajustes.some((movimiento) =>
        movimiento.detalles.some((detalle) => !detalle.cantidad.startsWith('-')),
      ),
    ).toBe(true);
  });

  it('busca por código, SKU, producto y almacén sin depender de mayúsculas ni tildes', () => {
    expect(
      filtrarMovimientosHistorial(movimientos, 'mov-2026-010', 'todos').map((m) => m.id),
    ).toEqual(['MOV-2026-010']);
    expect(filtrarMovimientosHistorial(movimientos, 'TOR-GAL-2', 'todos')).toHaveLength(2);
    expect(filtrarMovimientosHistorial(movimientos, 'taladro', 'todos')).toHaveLength(2);
    expect(
      filtrarMovimientosHistorial(movimientos, 'almacen principal', 'todos').length,
    ).toBeGreaterThan(0);
  });

  it('combina búsqueda y tipo y devuelve vacío sin coincidencias', () => {
    expect(filtrarMovimientosHistorial(movimientos, 'taladro', 'ingreso').map((m) => m.id)).toEqual(
      ['MOV-2026-003'],
    );
    expect(filtrarMovimientosHistorial(movimientos, 'taladro', 'ajuste')).toEqual([]);
    expect(filtrarMovimientosHistorial(movimientos, 'sin coincidencias', 'todos')).toEqual([]);
  });

  it('ordena por fecha descendente sin mutar la fixture', () => {
    const originales = [...movimientos];
    const resultado = filtrarMovimientosHistorial([...movimientos].reverse(), '', 'todos');
    expect(resultado.map((movimiento) => movimiento.id)).toEqual(
      [...movimientos]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((movimiento) => movimiento.id),
    );
    expect(movimientos).toEqual(originales);
  });
});
