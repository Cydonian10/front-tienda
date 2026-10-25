import { decimalCompacto, formatearSoles } from './decimal';

describe('formatearSoles', () => {
  it('muestra dos decimales y separadores de miles', () => {
    expect(formatearSoles('520.000000')).toBe('S/ 520.00');
    expect(formatearSoles('1234567.125000')).toBe('S/ 1,234,567.13');
    expect(formatearSoles('-0.000001')).toBe('S/ 0.00');
    expect(formatearSoles('-12.345000')).toBe('S/ -12.35');
    expect(formatearSoles('123456789012345678.125000')).toBe('S/ 123,456,789,012,345,678.13');
  });
});

describe('decimalCompacto', () => {
  it('elimina ceros finales sin ocultar precisión significativa', () => {
    expect(decimalCompacto('520.000000')).toBe('520');
    expect(decimalCompacto('0.000001')).toBe('0.000001');
    expect(decimalCompacto('-12.340000')).toBe('-12.34');
  });
});
