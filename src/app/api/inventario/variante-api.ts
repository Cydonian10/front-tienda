import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  CreateVarianteDto,
  UpdateVarianteDto,
  VarianteImagenEfectiva,
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

  update(productId: string, variantId: string, dto: UpdateVarianteDto): Promise<VarianteResponse> {
    const url = `${this.base}/productos/${productId}/variantes/${variantId}`;
    if (dto.imagenesConservarIds !== undefined || dto.imagenes?.length) {
      const body = new FormData();
      if (dto.precio !== undefined) body.append('precio', dto.precio);
      if (dto.codigoBarras !== undefined) body.append('codigoBarras', dto.codigoBarras ?? '');
      if (dto.activo !== undefined) body.append('activo', String(dto.activo));
      if (dto.imagenesConservarIds !== undefined) {
        body.append('imagenesConservarIds', JSON.stringify(dto.imagenesConservarIds));
      }
      for (const image of dto.imagenes ?? []) body.append('imagenes', image);
      return firstValueFrom(this.http.patch<VarianteResponse>(url, body));
    }

    const { imagenes, ...fields } = dto;
    return firstValueFrom(this.http.patch<VarianteResponse>(url, fields));
  }

  listImages(productId: string, variantId: string): Promise<VarianteImagenEfectiva[]> {
    return firstValueFrom(
      this.http.get<VarianteImagenEfectiva[]>(
        `${this.base}/productos/${productId}/variantes/${variantId}/imagenes`,
      ),
    );
  }

  getImage(productId: string, variantId: string, imageId: string): Promise<Blob> {
    return firstValueFrom(
      this.http.get(
        `${this.base}/productos/${productId}/variantes/${variantId}/imagenes/${imageId}/archivo`,
        { responseType: 'blob' },
      ),
    );
  }
}
