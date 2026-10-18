import type {
  CompraListadoResponse,
  VarianteCompraResponse,
} from '../../../api/interfaces/inventario/compra.interface';

export interface RenglonFormulario {
  key: number;
  variante: VarianteCompraResponse | null;
  unidadId: string;
  cantidad: string;
  precioUnitario: string;
}

/** Presenta los importes decimales sin convertirlos a Number. */
export function formatTotalPEN(value: string | null): string {
  if (value === null) return '—';
  const [whole, fraction = ''] = value.split('.');
  const decimals = fraction.replace(/0+$/, '').padEnd(2, '0');
  return `S/ ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimals}`;
}

export function documentoCompra(compra: CompraListadoResponse): string {
  const tipo = compra.tipoDocumento
    ? compra.tipoDocumento[0].toUpperCase() + compra.tipoDocumento.slice(1)
    : 'Documento';
  const numero = [compra.serieDocumento, compra.numeroDocumento].filter(Boolean).join('-');
  return numero ? `${tipo} ${numero}` : `${tipo} sin número`;
}

const MAX_INTEGER_DIGITS = 14;

function scaled(
  value: string,
  decimals: number,
  maxIntegerDigits = MAX_INTEGER_DIGITS,
): bigint | null {
  const match = new RegExp(
    `^(0|[1-9]\\d{0,${maxIntegerDigits - 1}})(?:\\.(\\d{1,${decimals}}))?$`,
  ).exec(value);
  if (!match) return null;
  return (
    BigInt(match[1]) * 10n ** BigInt(decimals) + BigInt((match[2] ?? '').padEnd(decimals, '0'))
  );
}

export function formatScaled(value: bigint, decimals = 6): string {
  const divisor = 10n ** BigInt(decimals);
  return `${value / divisor}.${String(value % divisor).padStart(decimals, '0')}`;
}

export function renglonCalculo(row: RenglonFormulario) {
  const cantidad = scaled(row.cantidad, 6);
  const precio = scaled(row.precioUnitario, 6);
  const unidad = row.variante?.unidades.find((item) => item.id === row.unidadId);
  const factor = unidad ? scaled(unidad.factorABase, 8) : null;
  const cantidadBaseEscalada = cantidad !== null && factor !== null ? cantidad * factor : null;
  const cantidadBaseExacta =
    cantidadBaseEscalada !== null && cantidadBaseEscalada % 100_000_000n === 0n;
  const subtotal =
    cantidad !== null && precio !== null ? (cantidad * precio + 500_000n) / 1_000_000n : null;

  return {
    unidad,
    cantidadValida: cantidad !== null && cantidad > 0n,
    precioValido: precio !== null,
    cantidadBaseExacta,
    cantidadBase: cantidadBaseExacta ? formatScaled(cantidadBaseEscalada! / 100_000_000n) : null,
    subtotal: subtotal === null ? null : formatScaled(subtotal),
    subtotalEscalado: subtotal,
  };
}

export function totalVistaPrevia(rows: readonly RenglonFormulario[]): string | null {
  if (!rows.length) return null;
  let total = 0n;
  for (const row of rows) {
    const result = renglonCalculo(row);
    if (
      !row.variante ||
      !result.unidad ||
      !result.cantidadValida ||
      !result.precioValido ||
      !result.cantidadBaseExacta ||
      result.subtotalEscalado === null
    )
      return null;
    total += result.subtotalEscalado;
  }
  return total >= 10n ** 20n ? null : formatScaled(total);
}
