import { decimalCompacto, descomponerUnidadBase, nombreUnidad } from './existencia-unidades.model';

describe('decimalCompacto', () => {
  it('omite ceros finales sin redondear ni perder decimales significativos', () => {
    expect(decimalCompacto('12.000000')).toBe('12');
    expect(decimalCompacto('12.340000')).toBe('12.34');
    expect(decimalCompacto('12.123456')).toBe('12.123456');
    expect(decimalCompacto('0.000001')).toBe('0.000001');
    expect(decimalCompacto('-12.5000')).toBe('-12.5');
  });

  it('deja intacta una cadena decimal mal formada', () => {
    expect(decimalCompacto('12.caja')).toBe('12.caja');
  });
});

describe('descomponerUnidadBase', () => {
  it('presenta 25 unidades como 2 cajas y 1 unidad base sin perder el resto', () => {
    expect(descomponerUnidadBase('25.000000', '12.00000000')).toEqual({
      completas: '2',
      restoBase: '1',
    });
    expect(nombreUnidad('Caja', '2')).toBe('cajas');
    expect(nombreUnidad('Unidad', '1')).toBe('unidad');
  });

  it('conserva los restos con factores decimales y saldos base fraccionarios', () => {
    expect(descomponerUnidadBase('1.250000', '0.30000000')).toEqual({
      completas: '4',
      restoBase: '0.05',
    });
    expect(descomponerUnidadBase('0.300000', '0.20000000')).toEqual({
      completas: '1',
      restoBase: '0.1',
    });
    expect(descomponerUnidadBase('2.375000', '0.12500000')).toEqual({
      completas: '19',
      restoBase: '0',
    });
  });

  it('no usa Number ni pierde precisión con saldos grandes o fracciones pequeñas', () => {
    expect(descomponerUnidadBase('9007199254740993.000001', '0.00000001')).toEqual({
      completas: '900719925474099300000100',
      restoBase: '0',
    });
    expect(descomponerUnidadBase('0.000001', '0.00000030')).toEqual({
      completas: '3',
      restoBase: '0.0000001',
    });
  });

  it('descarta factores cero y entradas mal formadas', () => {
    expect(descomponerUnidadBase('25', '0')).toBeNull();
    expect(descomponerUnidadBase('25', '0.00000000')).toBeNull();
    expect(descomponerUnidadBase('-1', '12')).toBeNull();
    expect(descomponerUnidadBase('25', 'caja')).toBeNull();
  });
});
