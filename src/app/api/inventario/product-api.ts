import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '../config/env-dev';
import { firstValueFrom } from 'rxjs';

export interface CreateProductDto {
  nombre: string;
  descripcion: string;
  unidadBaseId: string;
  activo: boolean;
  imagenes: File[];
}

export interface Unidad {
  id: string;
  nombre: string;
  simbolo: string;
}

@Injectable({ providedIn: 'root' })
export class ProductoApi {
  readonly #apirUrl = inject(ENVIRONMENT);
  readonly #http = inject(HttpClient);

  listUnidades(): Promise<Unidad[]> {
    return firstValueFrom(
      this.#http.get<{ data: Unidad[] }>(`${this.#apirUrl.apiUrl}/unidades`, {
        params: { limit: 100 },
      }),
    ).then((response) => response.data);
  }

  create(dto: CreateProductDto): Promise<{ id: string }> {
    const body = new FormData();
    body.append('nombre', dto.nombre);
    body.append('descripcion', dto.descripcion);
    body.append('unidadBaseId', dto.unidadBaseId);
    body.append('activo', String(dto.activo));
    for (const image of dto.imagenes) body.append('imagenes', image);

    return firstValueFrom(
      this.#http.post<{ id: string }>(`${this.#apirUrl.apiUrl}/productos`, body),
    );
  }
}
