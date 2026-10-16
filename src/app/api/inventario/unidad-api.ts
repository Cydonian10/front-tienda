import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  CreateUnidadDto,
  PaginatedUnidades,
  UnidadMedida,
  UpdateUnidadDto,
} from '../interfaces/inventario/unidad.interface';

@Injectable({ providedIn: 'root' })
export class UnidadApi {
  private readonly environment = inject(ENVIRONMENT);
  private readonly http = inject(HttpClient);

  list(page: number, limit: number, nombre?: string): Promise<PaginatedUnidades> {
    return firstValueFrom(
      this.http.get<PaginatedUnidades>(`${this.environment.apiUrl}/unidades`, {
        params: { page, limit, ...(nombre ? { nombre } : {}) },
      }),
    );
  }

  create(dto: CreateUnidadDto): Promise<UnidadMedida> {
    return firstValueFrom(this.http.post<UnidadMedida>(`${this.environment.apiUrl}/unidades`, dto));
  }

  update(id: string, dto: UpdateUnidadDto): Promise<UnidadMedida> {
    return firstValueFrom(
      this.http.patch<UnidadMedida>(`${this.environment.apiUrl}/unidades/${id}`, dto),
    );
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.environment.apiUrl}/unidades/${id}`));
  }
}
