import { Injectable, computed, signal } from '@angular/core';
import type {
  UnidadVenta,
  VarianteCatalogo,
} from '../../../../api/interfaces/ventas/catalogo.interface';

export interface LineaCarrito {
  variante: VarianteCatalogo;
  unidad: UnidadVenta;
  cantidad: string;
  cantidadBase: bigint;
  precioCentavos: bigint;
  subtotalCentavos: bigint;
}

function escalar(valor: string, decimales: number, enteros: number): bigint | null {
  const partes = new RegExp(`^(\\d{1,${enteros}})(?:\\.(\\d{1,${decimales}}))?$`).exec(valor);
  return partes
    ? BigInt(partes[1]) * 10n ** BigInt(decimales) +
        BigInt((partes[2] ?? '').padEnd(decimales, '0') || '0')
    : null;
}

export function textoEscalado(valor: bigint, decimales: number): string {
  const divisor = 10n ** BigInt(decimales);
  const fraccion = String(valor % divisor)
    .padStart(decimales, '0')
    .replace(/0+$/, '');
  return `${valor / divisor}${fraccion ? `.${fraccion}` : ''}`;
}

export function solesCentavos(valor: bigint): string {
  return `S/ ${new Intl.NumberFormat('es-PE').format(valor / 100n)}.${String(valor % 100n).padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class CarritoVentaService {
  private readonly estado = signal<LineaCarrito[]>([]);
  readonly lineas = this.estado.asReadonly();
  readonly total = computed(() =>
    this.lineas().reduce((suma, linea) => suma + linea.subtotalCentavos, 0n),
  );

  disponible(variante: VarianteCatalogo): bigint {
    const stock = escalar(variante.stock, 6, 18) ?? 0n;
    const usado = this.lineas()
      .filter((linea) => linea.variante.id === variante.id)
      .reduce((suma, linea) => suma + linea.cantidadBase, 0n);
    return stock > usado ? stock - usado : 0n;
  }

  calcular(variante: VarianteCatalogo, unidad: UnidadVenta | undefined, cantidadTexto: string) {
    const cantidad = escalar(cantidadTexto, 6, 14);
    const factor = unidad ? escalar(unidad.factorABase, 8, 12) : null;
    const precioBase = escalar(variante.precio, 2, 16);
    if (
      !unidad ||
      cantidad === null ||
      cantidad <= 0n ||
      factor === null ||
      factor <= 0n ||
      precioBase === null
    )
      return { error: 'Ingresa una cantidad mayor que cero con hasta 6 decimales.' };
    const conversion = cantidad * factor;
    if (conversion % 100_000_000n !== 0n || conversion / 100_000_000n >= 10n ** 24n)
      return { error: 'La cantidad no tiene una equivalencia válida en la unidad base.' };
    const cantidadBase = conversion / 100_000_000n;
    if (cantidadBase > this.disponible(variante))
      return { error: 'La cantidad supera el stock disponible.' };
    const precioCentavos = (precioBase * factor + 50_000_000n) / 100_000_000n;
    const subtotalCentavos = (precioCentavos * cantidad + 500_000n) / 1_000_000n;
    if (precioCentavos >= 10n ** 18n || subtotalCentavos >= 10n ** 18n)
      return { error: 'El importe supera el límite permitido.' };
    const anterior = this.lineas().find(
      (linea) => linea.variante.id === variante.id && linea.unidad.id === unidad.id,
    );
    const cantidadAnterior = anterior ? (escalar(anterior.cantidad, 6, 14) ?? 0n) : 0n;
    if (cantidad + cantidadAnterior >= 10n ** 20n)
      return { error: 'La cantidad acumulada supera el límite permitido.' };
    // Al unir líneas se redondea el subtotal de la cantidad acumulada, igual que la API.
    const subtotalAcumulado =
      (precioCentavos * (cantidad + cantidadAnterior) + 500_000n) / 1_000_000n;
    const total = this.total() - (anterior?.subtotalCentavos ?? 0n) + subtotalAcumulado;
    if (subtotalAcumulado >= 10n ** 18n || total >= 10n ** 18n)
      return { error: 'El total supera el límite permitido.' };
    return {
      cantidad,
      cantidadBase,
      precioCentavos,
      subtotalCentavos,
      subtotalAcumulado,
      anterior,
      error: '',
    };
  }

  agregar(variante: VarianteCatalogo, unidad: UnidadVenta, cantidad: string): boolean {
    const calculo = this.calcular(variante, unidad, cantidad);
    if (
      calculo.error ||
      calculo.cantidad === undefined ||
      calculo.cantidadBase === undefined ||
      calculo.precioCentavos === undefined ||
      calculo.subtotalAcumulado === undefined
    )
      return false;
    const anterior = calculo.anterior;
    const nueva: LineaCarrito = {
      variante,
      unidad,
      cantidad: textoEscalado(
        calculo.cantidad + (anterior ? escalar(anterior.cantidad, 6, 14)! : 0n),
        6,
      ),
      cantidadBase: calculo.cantidadBase + (anterior?.cantidadBase ?? 0n),
      precioCentavos: calculo.precioCentavos,
      subtotalCentavos: calculo.subtotalAcumulado,
    };
    this.estado.update((lineas) => [...lineas.filter((linea) => linea !== anterior), nueva]);
    return true;
  }

  quitar(linea: LineaCarrito): void {
    this.estado.update((lineas) => lineas.filter((item) => item !== linea));
  }
}
