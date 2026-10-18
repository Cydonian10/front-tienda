import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  CompraListadoResponse,
  CompraResponse,
  PaginatedResponse,
} from '../interfaces/inventario/compra.interface';

@Injectable({ providedIn: 'root' })
export class CompraApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/compras`;

  list(page: number, limit: number, q?: string): Promise<PaginatedResponse<CompraListadoResponse>> {
    return firstValueFrom(
      this.http.get<PaginatedResponse<CompraListadoResponse>>(this.url, {
        params: { page, limit, ...(q ? { q } : {}) },
      }),
    );
  }

  getById(id: string): Promise<CompraResponse> {
    return firstValueFrom(this.http.get<CompraResponse>(`${this.url}/${id}`));
  }
}
