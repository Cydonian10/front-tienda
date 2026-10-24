import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type { CrearMarcaDto, EditarMarcaDto, Marca, MarcasPagina } from '../interfaces/inventario/marca.interface';

@Injectable({ providedIn: 'root' })
export class MarcaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/marcas`;

  list({ q, activo, page, limit }: { q?: string; activo?: boolean; page: number; limit: number }): Promise<MarcasPagina> {
    return firstValueFrom(this.http.get<MarcasPagina>(this.url, {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(activo !== undefined ? { activo: String(activo) } : {}),
      },
    }));
  }

  getById(id: string): Promise<Marca> {
    return firstValueFrom(this.http.get<Marca>(`${this.url}/${id}`));
  }

  create(dto: CrearMarcaDto): Promise<Marca> {
    if (!dto.imagen) return firstValueFrom(this.http.post<Marca>(this.url, { nombre: dto.nombre }));
    const body = new FormData();
    body.append('nombre', dto.nombre);
    body.append('imagen', dto.imagen);
    return firstValueFrom(this.http.post<Marca>(this.url, body));
  }

  update(id: string, dto: EditarMarcaDto): Promise<Marca> {
    if (dto.imagen && dto.quitarImagen) {
      return Promise.reject(new Error('No se puede subir y quitar la imagen a la vez.'));
    }
    if (!dto.imagen) {
      const { nombre, quitarImagen } = dto;
      return firstValueFrom(this.http.patch<Marca>(`${this.url}/${id}`, {
        ...(nombre !== undefined ? { nombre } : {}),
        ...(quitarImagen !== undefined ? { quitarImagen } : {}),
      }));
    }
    const body = new FormData();
    if (dto.nombre !== undefined) body.append('nombre', dto.nombre);
    body.append('imagen', dto.imagen);
    return firstValueFrom(this.http.patch<Marca>(`${this.url}/${id}`, body));
  }

  changeStatus(id: string, activo: boolean): Promise<Marca> {
    return firstValueFrom(this.http.patch<Marca>(`${this.url}/${id}/estado`, { activo }));
  }

  getImage(id: string): Promise<Blob> {
    return firstValueFrom(this.http.get(`${this.url}/${id}/imagen`, { responseType: 'blob' }));
  }
}
