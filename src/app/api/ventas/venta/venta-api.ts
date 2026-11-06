import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SKIP_API_ERROR_TOAST } from '../../../shared/interceptors/api-error.interceptor';
import { ENVIRONMENT } from '../../config/env-dev';
import type { CrearVentaDto, VentaCreada } from '../../interfaces/ventas/venta.interface';

@Injectable({ providedIn: 'root' })
export class VentaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);

  crear(dto: CrearVentaDto, claveIdempotencia: string): Promise<VentaCreada> {
    return firstValueFrom(
      this.http.post<VentaCreada>(`${this.environment.apiUrl}/ventas`, dto, {
        headers: { 'Idempotency-Key': claveIdempotencia },
        context: new HttpContext().set(SKIP_API_ERROR_TOAST, true),
      }),
    );
  }
}
