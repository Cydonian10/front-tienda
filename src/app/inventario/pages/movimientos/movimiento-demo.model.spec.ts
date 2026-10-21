import { cantidadBase, DetalleDemo, validarMovimiento } from './movimiento-demo.model';

const fila = (overrides: Partial<DetalleDemo> = {}): DetalleDemo => ({
  id: 1,
  varianteId: 'martillo',
  cantidad: '2',
  unidad: 'base',
  costo: '',
  ...overrides,
});

describe('simulación de movimientos', () => {
  it('exige almacenes distintos para un traslado y motivo para un ajuste', () => {
    expect(validarMovimiento('traslado', 'principal', 'principal', '', [fila()])).toContain(
      'diferente',
    );
    expect(validarMovimiento('ajuste', 'principal', '', '  ', [fila()])).toContain('motivo');
    expect(validarMovimiento('salida', 'inexistente', '', '', [fila()])).toContain('almacén');
  });

  it('convierte cajas a unidades y controla el stock acumulado por variante', () => {
    expect(cantidadBase(fila({ cantidad: '3', unidad: 'caja' }))).toBe(30);
    expect(
      validarMovimiento('salida', 'principal', '', '', [
        fila({ cantidad: '30' }),
        fila({ id: 2, cantidad: '2', unidad: 'caja' }),
      ]),
    ).toContain('insuficiente');
    expect(validarMovimiento('salida', 'principal', '', '', [fila({ cantidad: '2' })])).toBeNull();
  });

  it('acepta ajustes positivos o negativos, pero nunca cero ni más reducción que el saldo', () => {
    expect(
      validarMovimiento('ajuste', 'centro', '', 'Conteo', [fila({ cantidad: '-3' })]),
    ).toBeNull();
    expect(
      validarMovimiento('ajuste', 'centro', '', 'Conteo', [fila({ cantidad: '-13' })]),
    ).toContain('insuficiente');
    expect(
      validarMovimiento('ajuste', 'centro', '', 'Conteo', [fila({ cantidad: '0' })]),
    ).toContain('distinta de cero');
    expect(validarMovimiento('salida', 'centro', '', '', [fila({ cantidad: '-1' })])).toContain(
      'mayor que cero',
    );
  });
});
