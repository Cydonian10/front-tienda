/** Formatea un importe decimal en soles sin perder precisión al convertirlo a Number. */
export function formatearSoles(valor: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(valor);
  if (!match) return '—';
  const [, signo, entero, decimales = ''] = match;
  const centavos = BigInt(entero) * 100n + BigInt(decimales.padEnd(2, '0').slice(0, 2));
  const redondeado = centavos + (Number(decimales[2] ?? '0') >= 5 ? 1n : 0n);
  const parteEntera = redondeado / 100n;
  const fraccion = String(redondeado % 100n).padStart(2, '0');
  return `S/ ${signo && redondeado !== 0n ? '-' : ''}${new Intl.NumberFormat('es-PE').format(parteEntera)}.${fraccion}`;
}

/** Quita ceros finales de cantidades y factores, conservando los decimales significativos. */
export function decimalCompacto(valor: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(valor);
  if (!match) return valor;
  const [, signo, entero, fraccion = ''] = match;
  const significativa = fraccion.replace(/0+$/, '');
  return `${signo}${entero}${significativa ? `.${significativa}` : ''}`;
}
