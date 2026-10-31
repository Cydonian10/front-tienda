import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import type { Caja, CrearCajaDto } from '../interfaces/ventas/caja.interface';

@Injectable({ providedIn: 'root' })
export class CajaApi {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(ENVIRONMENT);
  private readonly url = `${this.environment.apiUrl}/cajas`;

  create(dto: CrearCajaDto): Promise<Caja> {
    return firstValueFrom(this.http.post<Caja>(this.url, dto));
  }
}
