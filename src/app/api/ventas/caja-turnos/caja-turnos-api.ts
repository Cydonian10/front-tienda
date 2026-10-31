import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../../config/env-dev';
import type { AbrirTurnoDto, TurnoAbierto } from '../../interfaces/ventas/caja-turno.interface';
import { SKIP_API_ERROR_TOAST } from '../../../shared/interceptors/api-error.interceptor';

@Injectable({ providedIn: 'root' })
export class CajaTurnosApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);

  abrir(cajaId: string, dto: AbrirTurnoDto = {}): Promise<TurnoAbierto> {
    return firstValueFrom(
      this.http.post<TurnoAbierto>(`${this.environment.apiUrl}/cajas/${cajaId}/turnos`, dto, {
        context: new HttpContext().set(SKIP_API_ERROR_TOAST, true),
      }),
    );
  }
}
