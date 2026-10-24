import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '../config/env-dev';
import { firstValueFrom } from 'rxjs';
import {
  AtributoProducto,
  CreateProductDto,
  ProductResponse,
  ProductosPagina,
  Unidad,
  UpdateProductDto,
} from '../interfaces/inventario/producto.interface';

@Injectable({ providedIn: 'root' })
export class ProductoApi {
  readonly #apirUrl = inject(ENVIRONMENT);
  readonly #http = inject(HttpClient);

  search({ q, page, limit }: { q: string; page: number; limit: number }): Promise<ProductosPagina> {
    const params = new HttpParams().set('q', q).set('page', page).set('limit', limit);
    return firstValueFrom(
      this.#http.get<ProductosPagina>(`${this.#apirUrl.apiUrl}/productos`, { params }),
    );
  }

  listAttributes(productId: string): Promise<AtributoProducto[]> {
    return firstValueFrom(
      this.#http.get<AtributoProducto[]>(
        `${this.#apirUrl.apiUrl}/productos/${productId}/atributos`,
      ),
    );
  }

  addAttribute(productId: string, atributoId: string): Promise<unknown> {
    return firstValueFrom(
      this.#http.post(`${this.#apirUrl.apiUrl}/productos/${productId}/atributos`, { atributoId }),
    );
  }

  removeAttribute(productId: string, atributoId: string): Promise<void> {
    return firstValueFrom(
      this.#http.delete<void>(
        `${this.#apirUrl.apiUrl}/productos/${productId}/atributos/${atributoId}`,
      ),
    );
  }

  listUnidades(): Promise<Unidad[]> {
    return firstValueFrom(
      this.#http.get<{ data: Unidad[] }>(`${this.#apirUrl.apiUrl}/unidades`, {
        params: { limit: 100 },
      }),
    ).then((response) => response.data);
  }

  create(dto: CreateProductDto): Promise<ProductResponse> {
    if (!dto.marcaId || !this.validCategories(dto.categoriasIds)) {
      return Promise.reject(new Error('Selecciona una marca y al menos una categoría distinta.'));
    }
    const body = new FormData();
    body.append('nombre', dto.nombre);
    body.append('descripcion', dto.descripcion);
    body.append('unidadBaseId', dto.unidadBaseId);
    body.append('activo', String(dto.activo));
    body.append('marcaId', dto.marcaId);
    body.append('categoriasIds', JSON.stringify(dto.categoriasIds));
    for (const image of dto.imagenes) body.append('imagenes', image);

    return firstValueFrom(
      this.#http.post<ProductResponse>(`${this.#apirUrl.apiUrl}/productos`, body),
    );
  }

  getById(id: string): Promise<ProductResponse> {
    return firstValueFrom(
      this.#http.get<ProductResponse>(`${this.#apirUrl.apiUrl}/productos/${id}`),
    );
  }

  update(id: string, dto: UpdateProductDto): Promise<ProductResponse> {
    if (dto.marcaId === '') return Promise.reject(new Error('Selecciona una marca válida.'));
    if (dto.categoriasIds !== undefined && !this.validCategories(dto.categoriasIds)) {
      return Promise.reject(new Error('Selecciona al menos una categoría distinta.'));
    }
    if (dto.imagenesConservarIds !== undefined || dto.imagenes?.length) {
      const body = new FormData();
      body.append('nombre', dto.nombre);
      body.append('descripcion', dto.descripcion);
      body.append('unidadBaseId', dto.unidadBaseId);
      body.append('activo', String(dto.activo));
      if (dto.marcaId !== undefined) body.append('marcaId', dto.marcaId);
      if (dto.categoriasIds !== undefined) body.append('categoriasIds', JSON.stringify(dto.categoriasIds));
      if (dto.imagenesConservarIds !== undefined) {
        body.append('imagenesConservarIds', JSON.stringify(dto.imagenesConservarIds));
      }
      for (const image of dto.imagenes ?? []) body.append('imagenes', image);
      return firstValueFrom(
        this.#http.patch<ProductResponse>(`${this.#apirUrl.apiUrl}/productos/${id}`, body),
      );
    }
    const { imagenes: _imagenes, ...fields } = dto;
    return firstValueFrom(
      this.#http.patch<ProductResponse>(`${this.#apirUrl.apiUrl}/productos/${id}`, fields),
    );
  }

  getImage(productId: string, imageId: string): Promise<Blob> {
    return firstValueFrom(
      this.#http.get(`${this.#apirUrl.apiUrl}/productos/${productId}/imagenes/${imageId}/archivo`, {
        responseType: 'blob',
      }),
    );
  }

  private validCategories(ids: string[]): boolean {
    return ids.length > 0 && ids.every((id) => !!id) && new Set(ids).size === ids.length;
  }
}
