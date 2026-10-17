import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  Almacen,
  CreateAlmacenDto,
  PaginatedAlmacenes,
  UpdateAlmacenDto,
} from '../interfaces/inventario/almacen.interface';

@Injectable({ providedIn: 'root' })
export class AlmacenApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/almacenes`;

  list(page: number, limit: number, nombre: string, activo?: boolean): Promise<PaginatedAlmacenes> {
    return firstValueFrom(
      this.http.get<PaginatedAlmacenes>(this.url, {
        params: {
          page,
          limit,
          ...(nombre ? { nombre } : {}),
          ...(activo !== undefined ? { activo: String(activo) } : {}),
        },
      }),
    );
  }

  create(dto: CreateAlmacenDto): Promise<Almacen> {
    return firstValueFrom(this.http.post<Almacen>(this.url, dto));
  }

  update(id: string, dto: UpdateAlmacenDto): Promise<Almacen> {
    return firstValueFrom(this.http.patch<Almacen>(`${this.url}/${id}`, dto));
  }
}
