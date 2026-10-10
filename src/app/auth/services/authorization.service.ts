import { Injectable, inject } from '@angular/core';
import { PermissionCode } from '../../api/interfaces/access-control/permision.interface';
import { AuthStore } from '../../store/auth/auth.store';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly store = inject(AuthStore);

  hasPermission(systemCode: string, permissionCode: PermissionCode): boolean {
    const profile = this.store.authPerfil();
    if (!profile) return false;
    if (profile.isSuperAdmin) return true;

    return profile.permissions.some(
      (permission) => permission.systemCode === systemCode && permission.code === permissionCode,
    );
  }
}
