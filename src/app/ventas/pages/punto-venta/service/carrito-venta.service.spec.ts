import { describe, expect, it } from 'vitest';
import type { VarianteCatalogo } from '../../../../api/interfaces/ventas/catalogo.interface';
import { CarritoVentaService } from './carrito-venta.service';

const variante: VarianteCatalogo = {
  id: 'v1',
  productoId: 'p1',
  nombre: 'Tornillo',
  sku: 'TOR',
  precio: '0.50',
  stock: '30.000000',
  atributos: [],
  unidadBase: { id: 'u1', nombre: 'Unidad', simbolo: 'u' },
  unidades: [
    { id: 'u1', nombre: 'Unidad', simbolo: 'u', factorABase: '1' },
    { id: 'u2', nombre: 'Caja', simbolo: 'caja', factorABase: '12.00000000' },
    { id: 'u3', nombre: 'Fracción', simbolo: 'fr', factorABase: '0.33333333' },
  ],
};

describe('CarritoVentaService', () => {
  it('combina líneas iguales y controla el stock entre unidades distintas', () => {
    // Agregar cajas y unidades del mismo producto.
    const carrito = new CarritoVentaService();
    expect(carrito.agregar(variante, variante.unidades[1], '1')).toBe(true);
    expect(carrito.agregar(variante, variante.unidades[1], '1')).toBe(true);
    expect(carrito.agregar(variante, variante.unidades[0], '6')).toBe(true);
    const resultado = carrito.lineas();
    expect(resultado).toHaveLength(2);
    expect(resultado[0].cantidad).toBe('2');
    expect(carrito.total()).toBe(1500n);
    expect(carrito.disponible(variante)).toBe(0n);
    expect(carrito.agregar(variante, variante.unidades[0], '0.1')).toBe(false);
    // Quitar una línea devuelve su cantidad a la disponibilidad local.
    carrito.quitar(resultado[0]);
    expect(carrito.disponible(variante)).toBe(24_000_000n);
  });

  it('valida decimales, conversiones exactas y redondeo de precios', () => {
    const carrito = new CarritoVentaService();
    const calculo = carrito.calcular(variante, variante.unidades[1], '0.5');
    expect(calculo.cantidadBase).toBe(6_000_000n);
    expect(calculo.subtotalCentavos).toBe(300n);
    expect(carrito.calcular(variante, variante.unidades[0], '0').error).toBeTruthy();
    expect(carrito.calcular(variante, variante.unidades[0], '1.0000001').error).toBeTruthy();
    expect(carrito.calcular(variante, variante.unidades[2], '1').error).toContain('equivalencia');
    const precioFraccionado = { ...variante, precio: '0.01' };
    const redondeo = carrito.calcular(
      precioFraccionado,
      { ...variante.unidades[1], factorABase: '1.5' },
      '2',
    );
    expect(redondeo.precioCentavos).toBe(2n);
    expect(redondeo.subtotalCentavos).toBe(4n);
  });
});
