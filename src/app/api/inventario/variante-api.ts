import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  CreateVarianteDto,
  VarianteResponse,
} from '../interfaces/inventario/variante.interface';

@Injectable({ providedIn: 'root' })
export class VarianteApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(ENVIRONMENT).apiUrl;

  list(productId: string): Promise<VarianteResponse[]> {
    return firstValueFrom(
      this.http.get<VarianteResponse[]>(`${this.base}/productos/${productId}/variantes`),
    );
  }

  create(productId: string, dto: CreateVarianteDto): Promise<VarianteResponse> {
    const body = new FormData();
    if (dto.sku) body.append('sku', dto.sku);
    body.append('precio', dto.precio);
    if (dto.codigoBarras) body.append('codigoBarras', dto.codigoBarras);
    body.append('valores', JSON.stringify(dto.valores));
    for (const image of dto.imagenes) body.append('imagenes', image);
    return firstValueFrom(
      this.http.post<VarianteResponse>(`${this.base}/productos/${productId}/variantes`, body),
    );
  }
}
