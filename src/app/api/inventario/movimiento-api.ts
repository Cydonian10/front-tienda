import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type {
  FiltroHistorialMovimientos,
  HistorialMovimientoDetalle,
  HistorialMovimientosPagina,
} from '../interfaces/inventario/historial-movimiento.interface';
import type {
  AlmacenMovimiento,
  FiltroVariantesMovimiento,
  ListaVariantesMovimientoResponse,
  MovimientoCreado,
  NuevoMovimiento,
} from '../interfaces/inventario/movimiento.interface';
import type { PeriodoActividadInventario, ResumenSalidasInventario } from '../interfaces/inventario/resumen-reposicion.interface';

@Injectable({ providedIn: 'root' })
export class MovimientoApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/movimientos`;

  resumenSalidas(almacenId: string, { desde, hasta }: PeriodoActividadInventario): Promise<ResumenSalidasInventario> {
    return firstValueFrom(
      this.http.get<ResumenSalidasInventario>(`${this.url}/resumen-salidas`, {
        params: { almacenId, desde, hasta },
      }),
    );
  }

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

  listarHistorial(filtro: FiltroHistorialMovimientos): Promise<HistorialMovimientosPagina> {
    let params = new HttpParams().set('page', filtro.page).set('limit', filtro.limit);
    if (filtro.q !== undefined) params = params.set('q', filtro.q);
    if (filtro.tipo !== undefined) params = params.set('tipo', filtro.tipo);
    if (filtro.desde !== undefined) params = params.set('desde', filtro.desde);
    if (filtro.hasta !== undefined) params = params.set('hasta', filtro.hasta);

    return firstValueFrom(this.http.get<HistorialMovimientosPagina>(this.url, { params }));
  }

  obtenerHistorial(id: string): Promise<HistorialMovimientoDetalle> {
    return firstValueFrom(this.http.get<HistorialMovimientoDetalle>(`${this.url}/${encodeURIComponent(id)}`));
  }

  crear(movimiento: NuevoMovimiento): Promise<MovimientoCreado> {
    return firstValueFrom(this.http.post<MovimientoCreado>(this.url, movimiento));
  }
}
