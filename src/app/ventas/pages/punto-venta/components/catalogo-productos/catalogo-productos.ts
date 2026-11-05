import { Component, computed, debounced, effect, input, signal } from '@angular/core';
import { Pagination } from '../../../../../shared/components/pagination/pagination';
import { useCatalogoVentas } from '../../../../actions/use-catalogo-ventas-action';

@Component({
  selector: 'app-catalogo-productos',
  imports: [Pagination],
  templateUrl: './catalogo-productos.html',
  styleUrl: './catalogo-productos.css',
})
export class CatalogoProductos {
  readonly almacenId = input.required<string>();
  readonly pagina = signal(1);
  readonly limite = signal(5);
  readonly busqueda = signal('');
  readonly busquedaDiferida = debounced(this.busqueda, 300);
  readonly busquedaAplicada = signal('');
  readonly catalogo = useCatalogoVentas(() => ({
    almacenId: this.almacenId(),
    q: this.busquedaAplicada(),
    page: this.pagina(),
    limit: this.limite(),
  }));
  readonly totalPaginas = computed(() =>
    Math.ceil((this.catalogo.data()?.totalItems ?? 0) / this.limite()),
  );

  constructor() {
    effect(() => {
      const texto = this.busquedaDiferida.value();
      if (texto === undefined || texto !== this.busqueda()) return;
      const termino = texto.trim();
      if (termino === this.busquedaAplicada()) return;
      this.pagina.set(1);
      this.busquedaAplicada.set(termino);
    });
  }

  buscar(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  cambiarLimite(limite: number): void {
    this.pagina.set(1);
    this.limite.set(limite);
  }
}
