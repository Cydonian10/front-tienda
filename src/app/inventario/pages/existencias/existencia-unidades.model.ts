export { decimalCompacto } from '../../../shared/formatters/decimal';

export function descomponerUnidadBase(
  cantidadBase: string,
  factorABase: string,
): { completas: string; restoBase: string } | null {
  const cantidad = /^(\d+)(?:\.(\d+))?$/.exec(cantidadBase);
  const factor = /^(\d+)(?:\.(\d+))?$/.exec(factorABase);
  if (!cantidad || !factor) return null;

  const escala = Math.max(cantidad[2]?.length ?? 0, factor[2]?.length ?? 0);
  const convertir = (entero: string, fraccion: string | undefined) =>
    BigInt(entero) * 10n ** BigInt(escala) + BigInt((fraccion ?? '').padEnd(escala, '0') || '0');
  const unidadesBase = convertir(cantidad[1], cantidad[2]);
  const factorBase = convertir(factor[1], factor[2]);
  if (factorBase <= 0n) return null;

  const resto = unidadesBase % factorBase;
  const restoEntero = escala ? resto / 10n ** BigInt(escala) : resto;
  const restoFraccion = escala
    ? String(resto % 10n ** BigInt(escala))
        .padStart(escala, '0')
        .replace(/0+$/, '')
    : '';
  return {
    completas: String(unidadesBase / factorBase),
    restoBase: `${restoEntero}${restoFraccion ? `.${restoFraccion}` : ''}`,
  };
}

export function nombreUnidad(nombre: string, cantidad: string): string {
  const singular = nombre.toLocaleLowerCase('es-PE');
  if (cantidad === '1') return singular;
  if (singular.endsWith('z')) return `${singular.slice(0, -1)}ces`;
  return `${singular}${/[aeiouáéíóú]$/.test(singular) ? 's' : 'es'}`;
}
