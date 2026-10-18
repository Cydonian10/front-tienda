import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  AlmacenExistencia,
  FiltroExistencias,
  ListaExistenciasResponse,
} from '../interfaces/inventario/existencia.interface';

@Injectable({ providedIn: 'root' })
export class ExistenciaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/existencias`;

  listarAlmacenes(): Promise<AlmacenExistencia[]> {
    return firstValueFrom(this.http.get<AlmacenExistencia[]>(`${this.url}/almacenes`));
  }

  listar(filtro: FiltroExistencias): Promise<ListaExistenciasResponse> {
    let params = new HttpParams()
      .set('almacenId', filtro.almacenId)
      .set('page', filtro.page)
      .set('limit', filtro.limit);

    if (filtro.q !== undefined) params = params.set('q', filtro.q);
    if (filtro.disponibilidad !== undefined) {
      params = params.set('disponibilidad', filtro.disponibilidad);
    }

    return firstValueFrom(this.http.get<ListaExistenciasResponse>(this.url, { params }));
  }
}
