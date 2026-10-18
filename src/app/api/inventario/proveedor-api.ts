import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  PaginatedResponse,
  ProveedorResponse,
} from '../interfaces/inventario/compra.interface';

@Injectable({ providedIn: 'root' })
export class ProveedorApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/proveedores`;

  list(
    page: number,
    limit: number,
    nombre?: string,
    documento?: string,
  ): Promise<PaginatedResponse<ProveedorResponse>> {
    return firstValueFrom(
      this.http.get<PaginatedResponse<ProveedorResponse>>(this.url, {
        params: {
          page,
          limit,
          ...(nombre ? { nombre } : {}),
          ...(documento ? { documento } : {}),
        },
      }),
    );
  }

  listAll(nombre?: string, documento?: string): Promise<ProveedorResponse[]> {
    return firstValueFrom(
      this.http.get<ProveedorResponse[]>(`${this.url}/todos`, {
        params: {
          ...(nombre ? { nombre } : {}),
          ...(documento ? { documento } : {}),
        },
      }),
    );
  }
}
