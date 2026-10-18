import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  PaginatedResponse,
  VarianteCompraResponse,
} from '../interfaces/inventario/compra.interface';

@Injectable({ providedIn: 'root' })
export class VarianteCompraApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/variantes`;

  list(
    page: number,
    limit: number,
    q?: string,
  ): Promise<PaginatedResponse<VarianteCompraResponse>> {
    return firstValueFrom(
      this.http.get<PaginatedResponse<VarianteCompraResponse>>(this.url, {
        params: { page, limit, ...(q ? { q } : {}) },
      }),
    );
  }
}
