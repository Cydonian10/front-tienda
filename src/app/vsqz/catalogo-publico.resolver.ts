import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ENVIRONMENT } from '../api/config/env-dev';
import type { Catalogo, Categoria } from './catalogo-publico.page';

export interface DatosCatalogo {
  categoria: string;
  q: string;
  page: number;
  limit: number;
  categorias: Categoria[] | undefined;
  productos: Catalogo | undefined;
}

export const resolverCatalogo: ResolveFn<DatosCatalogo> = async (route) => {
  const api = inject(ENVIRONMENT).apiUrl;
  const categoria = route.queryParamMap.get('categoria') ?? '';
  const q = route.queryParamMap.get('q') ?? '';
  const page = Math.max(1, Number(route.queryParamMap.get('page')) || 1);
  const solicitado = Number(route.queryParamMap.get('limit'));
  const limit = [6, 12, 24].includes(solicitado) ? solicitado : 12;
  const params = new URLSearchParams({ categoria, q, page: String(page), limit: String(limit) });
  const leer = async <T>(url: string): Promise<T | undefined> => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return response.ok ? await response.json() as T : undefined;
    } catch { return undefined; }
  };
  const [categorias, productos] = await Promise.all([
    leer<Categoria[]>(`${api}/catalogo-publico/categorias`),
    leer<Catalogo>(`${api}/catalogo-publico/productos?${params}`),
  ]);
  return { categorias, productos, categoria, q, page, limit };
};
