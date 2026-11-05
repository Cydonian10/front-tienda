import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../../config/env-dev';
import type { CatalogoPagina, FiltrosCatalogo } from '../../interfaces/ventas/catalogo.interface';

@Injectable({ providedIn: 'root' })
export class CatalogoApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);

  list(filtros: FiltrosCatalogo): Promise<CatalogoPagina> {
    const params = new HttpParams()
      .set('almacenId', filtros.almacenId)
      .set('q', filtros.q)
      .set('page', filtros.page)
      .set('limit', filtros.limit);
    return firstValueFrom(this.http.get<CatalogoPagina>(`${this.environment.apiUrl}/ventas/catalogo`, { params }));
  }
}
