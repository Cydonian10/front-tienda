import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  Categoria, CategoriasPagina, CrearCategoriaDto, EditarCategoriaDto,
} from '../interfaces/inventario/categoria.interface';

@Injectable({ providedIn: 'root' })
export class CategoriaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/categorias`;

  list({ q, activo, page, limit }: { q?: string; activo?: boolean; page: number; limit: number }): Promise<CategoriasPagina> {
    return firstValueFrom(this.http.get<CategoriasPagina>(this.url, {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(activo !== undefined ? { activo: String(activo) } : {}),
      },
    }));
  }

  getById(id: string): Promise<Categoria> {
    return firstValueFrom(this.http.get<Categoria>(`${this.url}/${id}`));
  }

  create(dto: CrearCategoriaDto): Promise<Categoria> {
    return firstValueFrom(this.http.post<Categoria>(this.url, dto));
  }

  update(id: string, dto: EditarCategoriaDto): Promise<Categoria> {
    return firstValueFrom(this.http.patch<Categoria>(`${this.url}/${id}`, dto));
  }

  changeStatus(id: string, activo: boolean): Promise<Categoria> {
    return firstValueFrom(this.http.patch<Categoria>(`${this.url}/${id}/estado`, { activo }));
  }
}
