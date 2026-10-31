import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../../config/env-dev';
import type { Caja, CajaConTurnos, CrearCajaDto, FiltrarCajasDto } from '../../interfaces/ventas/caja.interface';

@Injectable({ providedIn: 'root' })
export class CajaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/cajas`;

  list(filtros: FiltrarCajasDto = {}): Promise<CajaConTurnos[]> {
    let params = new HttpParams();
    if (filtros.fechaOperativa) params = params.set('fechaOperativa', filtros.fechaOperativa);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    return firstValueFrom(this.http.get<CajaConTurnos[]>(this.url, { params }));
  }

  create(dto: CrearCajaDto): Promise<Caja> {
    return firstValueFrom(this.http.post<Caja>(this.url, dto));
  }
}
