import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import { CreateRolDto, FilterRolesDto, Role } from '../interfaces/access-control/role.interface';

@Service()
export class RolesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(ENVIRONMENT).apiUrl}`;

  findAll(filterDto: FilterRolesDto) {
    let params = new HttpParams();
    if (filterDto.systemId) {
      params = params.set('systemId', filterDto.systemId);
    }

    return firstValueFrom(this.http.get<Role[]>(`${this.baseUrl}/roles`, { params }));
  }

  create({ systemId, name, description }: CreateRolDto) {
    return firstValueFrom(
      this.http.post<Role>(`${this.baseUrl}/systems/${systemId}/roles`, {
        name,
        description,
      }),
    );
  }

  replacePermissions(roleId: string, permissionIds: string[]) {
    return firstValueFrom(
      this.http.put<{ permissionIds: string[] }>(`${this.baseUrl}/roles/${roleId}/permissions`, {
        permissionIds,
      }),
    );
  }

  delete(rolId: string) {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/roles/${rolId}`));
  }
}
