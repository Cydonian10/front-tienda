import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  AgregarUnidadProductoDto,
  EditarUnidadProductoDto,
  UnidadProductoResponse,
} from '../interfaces/inventario/unidad-producto.interface';

@Injectable({ providedIn: 'root' })
export class UnidadProductoApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(ENVIRONMENT).apiUrl;

  list(productId: string): Promise<UnidadProductoResponse[]> {
    return firstValueFrom(
      this.http.get<UnidadProductoResponse[]>(`${this.base}/productos/${productId}/unidades`),
    );
  }

  create(productId: string, dto: AgregarUnidadProductoDto): Promise<UnidadProductoResponse> {
    return firstValueFrom(
      this.http.post<UnidadProductoResponse>(`${this.base}/productos/${productId}/unidades`, dto),
    );
  }

  update(
    productId: string,
    assignmentId: string,
    dto: EditarUnidadProductoDto,
  ): Promise<UnidadProductoResponse> {
    return firstValueFrom(
      this.http.patch<UnidadProductoResponse>(
        `${this.base}/productos/${productId}/unidades/${assignmentId}`,
        dto,
      ),
    );
  }

  remove(productId: string, assignmentId: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.base}/productos/${productId}/unidades/${assignmentId}`),
    );
  }
}
