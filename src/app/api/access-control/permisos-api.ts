import { inject, Service } from '@angular/core';
import { ENVIRONMENT } from '../config/env-dev';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FilterPermision, Permiso } from '../interfaces/access-control/permision.interface';
import { firstValueFrom } from 'rxjs';

@Service()
export class PermisosApi {
  private enviroments = inject(ENVIRONMENT);
  private http = inject(HttpClient);

  findPermisos(dto: FilterPermision) {
    const url = `${this.enviroments.apiUrl}/permissions`;

    let params = new HttpParams();

    if (dto.rolId) {
      params = params.set('rolId', dto.rolId);
    }

    if (dto.systemCode) {
      params = params.set('systemCode', dto.systemCode);
    }

    return firstValueFrom(this.http.get<Permiso[]>(url, { params }));
  }
}
