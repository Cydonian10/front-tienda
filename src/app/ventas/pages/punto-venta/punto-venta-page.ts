import { Component, computed, signal } from '@angular/core';
import { PuntoVentaHeader } from './components/punto-venta-header/punto-venta-header';
import { PreparacionVenta } from './components/preparacion-venta/preparacion-venta';
import { PasosVenta } from './components/pasos-venta/pasos-venta';
import { VentaReciente, VentasRecientes } from './components/ventas-recientes/ventas-recientes';

type Vista = 'preparacion' | 'venta' | 'cobro' | 'ticket';

interface ProductoEjemplo {
  id: number;
  nombre: string;
  detalle: string;
  precio: number;
}

@Component({
  selector: 'app-punto-venta-page',
  imports: [PuntoVentaHeader, PreparacionVenta, PasosVenta, VentasRecientes],
  templateUrl: './punto-venta-page.html',
  host: { class: 'block' },
})
export default class PuntoVentaPage {
  readonly vista = signal<Vista>('preparacion');
  readonly almacen = signal('');
  readonly turno = signal('');
  readonly busqueda = signal('');
  readonly ticketReciente = signal(false);
  readonly ventasRecientes = signal<readonly VentaReciente[]>([]);
  readonly ventaRecienteSeleccionada = signal<VentaReciente | null>(null);
  readonly productos: ProductoEjemplo[] = [
    { id: 1, nombre: 'Martillo de uña', detalle: '16 oz · Unidad', precio: 28.5 },
    { id: 2, nombre: 'Cinta métrica', detalle: '5 metros · Unidad', precio: 18.9 },
    { id: 3, nombre: 'Tornillo para madera', detalle: '2 pulgadas · Caja', precio: 13.4 },
    { id: 4, nombre: 'Alicate universal', detalle: '8 pulgadas · Unidad', precio: 32 },
  ];
  readonly carrito = signal<{ producto: ProductoEjemplo; cantidad: number }[]>([]);
  readonly filtrados = computed(() => {
    const termino = this.busqueda().trim().toLocaleLowerCase();
    return this.productos.filter((producto) =>
      `${producto.nombre} ${producto.detalle}`.toLocaleLowerCase().includes(termino),
    );
  });
  readonly total = computed(() =>
    this.carrito().reduce((total, item) => total + item.producto.precio * item.cantidad, 0),
  );
  readonly unidades = computed(() =>
    this.carrito().reduce((total, item) => total + item.cantidad, 0),
  );

  seleccionar(event: Event, destino: 'almacen' | 'turno' | 'busqueda'): void {
    const valor = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this[destino].set(valor);
  }

  agregar(producto: ProductoEjemplo): void {
    this.carrito.update((items) => {
      const existente = items.find((item) => item.producto.id === producto.id);
      return existente
        ? items.map((item) =>
            item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item,
          )
        : [...items, { producto, cantidad: 1 }];
    });
  }

  quitar(id: number): void {
    this.carrito.update((items) => items.filter((item) => item.producto.id !== id));
  }
}
