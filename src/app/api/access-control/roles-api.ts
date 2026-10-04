import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ENVIRONMENT } from '../config/env-dev';
import { RoleRecord } from '../interfaces/access-control/role.interface';

@Service()
export class RolesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(ENVIRONMENT).apiUrl}`;

  findAll() {
    return firstValueFrom(this.http.get<RoleRecord[]>(`${this.baseUrl}/roles`));
  }

  create(systemId: string, name: string, description: string) {
    return firstValueFrom(
      this.http.post<RoleRecord>(`${this.baseUrl}/systems/${systemId}/roles`, { name, description }),
    );
  }

  replacePermissions(roleId: string, permissionIds: string[]) {
    return firstValueFrom(
      this.http.put<{ permissionIds: string[] }>(`${this.baseUrl}/roles/${roleId}/permissions`, {
        permissionIds,
      }),
    );
  }
}
