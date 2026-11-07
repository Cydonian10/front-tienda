import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SKIP_API_ERROR_TOAST } from '../../../shared/interceptors/api-error.interceptor';
import { ENVIRONMENT } from '../../config/env-dev';
import type { CrearMovimientoCajaDto, FiltroMovimientosCaja, PaginaMovimientosCaja } from '../../interfaces/ventas/movimiento-caja.interface';

@Injectable({ providedIn: 'root' })
export class MovimientoCajaApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(ENVIRONMENT).apiUrl}/movimientos-caja`;
  private readonly context = () => new HttpContext().set(SKIP_API_ERROR_TOAST, true);

  listar(filtro: FiltroMovimientosCaja): Promise<PaginaMovimientosCaja> {
    const params = new HttpParams().set('desde', filtro.desde).set('hasta', filtro.hasta)
      .set('page', filtro.page).set('limit', filtro.limit);
    return firstValueFrom(this.http.get<PaginaMovimientosCaja>(this.url, { params, context: this.context() }));
  }

  crear(dto: CrearMovimientoCajaDto, clave: string): Promise<{ id: string }> {
    return firstValueFrom(this.http.post<{ id: string }>(this.url, dto, {
      headers: { 'Idempotency-Key': clave }, context: this.context(),
    }));
  }
}
