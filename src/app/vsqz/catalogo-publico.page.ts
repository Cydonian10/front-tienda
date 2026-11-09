import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../api/config/env-dev';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import type { DatosCatalogo } from './catalogo-publico.resolver';
import { Pagination } from '../shared/components/pagination/pagination';

export interface Categoria {
  id: string;
  nombre: string;
}
interface Producto {
  id: string;
  nombre: string;
  atributos: { atributo: string; valor: string }[];
  tieneImagen: boolean;
  categorias: Categoria[];
  disponible: boolean;
}
export interface Catalogo {
  items: Producto[];
  totalItems: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-catalogo-publico',
  imports: [RouterLink, Pagination],
  templateUrl: './catalogo-publico.page.html',
  styleUrl: './catalogo-publico.page.css',
})
export default class CatalogoPublicoPage {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly datos = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly datosCatalogo = computed(() => this.datos()['catalogo'] as DatosCatalogo | undefined);
  readonly categoria = computed(() => this.params().get('categoria') ?? '');
  readonly busqueda = computed(() => this.params().get('q') ?? '');
  readonly pagina = computed(() => Math.max(1, Number(this.params().get('page')) || 1));
  readonly pageSizeOptions = [6, 12, 24] as const;
  readonly pageSize = computed(() => {
    const size = Number(this.params().get('limit'));
    return this.pageSizeOptions.find((option) => option === size) ?? 12;
  });
  readonly menu = signal(false);
  readonly imagenesFallidas = signal<ReadonlySet<string>>(new Set());
  imagenUrl(id: string): string {
    return `${this.api}/catalogo-publico/variantes/${encodeURIComponent(id)}/imagen`;
  }
  imagenFallida(id: string): void {
    this.imagenesFallidas.update((actual) => new Set([...actual, id]));
  }
  readonly categorias = injectQuery(() => ({
    queryKey: ['catalogo-publico', 'categorias'],
    enabled: this.browser,
    gcTime: this.browser ? 300_000 : Infinity,
    initialData: this.datosCatalogo()?.categorias,
    queryFn: () =>
      firstValueFrom(this.http.get<Categoria[]>(`${this.api}/catalogo-publico/categorias`)),
  }));
  readonly productos = injectQuery(() => {
    const categoria = this.categoria();
    const q = this.busqueda();
    const page = this.pagina();
    const limit = this.pageSize();
    return {
      queryKey: ['catalogo-publico', 'productos', categoria, q, page, limit],
      enabled: this.browser,
      gcTime: this.browser ? 300_000 : Infinity,
      initialData: this.datosCatalogo()?.categoria === categoria && this.datosCatalogo()?.q === q && this.datosCatalogo()?.page === page && this.datosCatalogo()?.limit === limit
        ? this.datosCatalogo()?.productos : undefined,
      queryFn: () =>
        firstValueFrom(
          this.http.get<Catalogo>(`${this.api}/catalogo-publico/productos`, {
            params: new HttpParams().set('categoria', categoria).set('q', q).set('page', page).set('limit', limit),
          }),
        ),
    };
  });
  readonly nombreCategoria = computed(
    () =>
      this.categorias.data()?.find((c) => c.id === this.categoria())?.nombre ??
      'Todas las categorías',
  );
  readonly totalPaginas = computed(() => Math.ceil((this.productos.data()?.totalItems ?? 0) / this.pageSize()));

  filtrar(categoria: string): void {
    this.menu.set(false);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoria: categoria || null, page: null },
      queryParamsHandling: 'merge',
      fragment: 'catalogo',
    });
  }
  buscar(event: Event, valor: string): void {
    event.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: valor.trim() || null, page: null },
      queryParamsHandling: 'merge',
      fragment: 'catalogo',
    });
  }
  cambiarPagina(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge',
      fragment: 'catalogo',
    });
  }
  cambiarTamano(limit: number): void {
    if (!this.pageSizeOptions.some((option) => option === limit)) return;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { limit: limit === 12 ? null : limit, page: null },
      queryParamsHandling: 'merge',
      fragment: 'catalogo',
    });
  }
}
