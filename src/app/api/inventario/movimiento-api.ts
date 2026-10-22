import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  AlmacenMovimiento,
  FiltroVariantesMovimiento,
  ListaVariantesMovimientoResponse,
  MovimientoCreado,
  NuevoMovimiento,
} from '../interfaces/inventario/movimiento.interface';

@Injectable({ providedIn: 'root' })
export class MovimientoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/movimientos`;

  listarAlmacenes(): Promise<AlmacenMovimiento[]> {
    return firstValueFrom(this.http.get<AlmacenMovimiento[]>(`${this.url}/almacenes`));
  }

  buscarVariantes(filtro: FiltroVariantesMovimiento): Promise<ListaVariantesMovimientoResponse> {
    return firstValueFrom(
      this.http.get<ListaVariantesMovimientoResponse>(`${this.url}/variantes`, {
        params: {
          tipo: filtro.tipo,
          almacenId: filtro.almacenId,
          q: filtro.q,
          page: filtro.page,
          limit: filtro.limit,
        },
      }),
    );
  }

  crear(movimiento: NuevoMovimiento): Promise<MovimientoCreado> {
    return firstValueFrom(this.http.post<MovimientoCreado>(this.url, movimiento));
  }
}
