import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  Atributo,
  AtributoDto,
  AtributosResponse,
} from '../interfaces/inventario/atributo.interface';

@Injectable({ providedIn: 'root' })
export class AtributoApi {
  private readonly environment = inject(ENVIRONMENT);
  private readonly http = inject(HttpClient);
  private readonly url = `${this.environment.apiUrl}/atributos`;

  list(page: number, limit: number, nombre?: string): Promise<AtributosResponse> {
    return firstValueFrom(
      this.http.get<AtributosResponse>(this.url, {
        params: { page, limit, ...(nombre ? { nombre } : {}) },
      }),
    );
  }

  create(dto: AtributoDto): Promise<Atributo> {
    return firstValueFrom(this.http.post<Atributo>(this.url, dto));
  }

  update(id: string, dto: AtributoDto): Promise<Atributo> {
    return firstValueFrom(this.http.patch<Atributo>(`${this.url}/${id}`, dto));
  }

  remove(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
}
