import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { useCategoriasListado } from '../../../../actions/use-categorias-action';
import { useMarcasListado } from '../../../../actions/use-marcas-action';

export interface OpcionCatalogo {
  id: string;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'catalogo-producto-selector',
  imports: [RouterLink],
  templateUrl: './catalogo-producto-selector.html',
  host: { class: 'block min-w-0' },
})
export class CatalogoProductoSelector {
  readonly kind = input.required<'marca' | 'categoria'>();
  readonly selected = input<readonly OpcionCatalogo[]>([]);
  readonly readOnly = input(false);
  readonly selectionChange = output<OpcionCatalogo[]>();
  readonly search = signal('');
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly active = () => true;
  readonly marcas = useMarcasListado(this.search, this.active, this.page, this.limit, () => this.kind() === 'marca' && !this.readOnly());
  readonly categorias = useCategoriasListado(this.search, this.active, this.page, this.limit, () => this.kind() === 'categoria' && !this.readOnly());
  readonly pending = computed(() => this.kind() === 'marca' ? this.marcas.isPending() : this.categorias.isPending());
  readonly fetching = computed(() => this.kind() === 'marca' ? this.marcas.isFetching() : this.categorias.isFetching());
  readonly failed = computed(() => this.kind() === 'marca' ? this.marcas.isError() : this.categorias.isError());
  readonly options = computed<OpcionCatalogo[]>(() => this.kind() === 'marca'
    ? (this.marcas.data()?.items ?? []).filter((item) => item.activo)
    : (this.categorias.data()?.items ?? []).filter((item) => item.activo));
  readonly totalPages = computed(() => Math.max(1, Math.ceil(((this.kind() === 'marca'
    ? this.marcas.data()?.totalItems : this.categorias.data()?.totalItems) ?? 0) / this.limit())));

  searchFor(value: string): void {
    this.page.set(1);
    this.search.set(value.trim().slice(0, 200));
  }

  choose(option: OpcionCatalogo): void {
    if (this.readOnly() || !option.activo) return;
    if (this.kind() === 'marca') {
      this.selectionChange.emit([option]);
    } else if (!this.selected().some((item) => item.id === option.id)) {
      this.selectionChange.emit([...this.selected(), option]);
    }
  }

  remove(id: string): void {
    if (!this.readOnly()) this.selectionChange.emit(this.selected().filter((item) => item.id !== id));
  }

  retry(): void {
    if (this.kind() === 'marca') void this.marcas.refetch();
    else void this.categorias.refetch();
  }
}
