import { computed, inject, type Signal } from '@angular/core';
import type { PermissionCode } from '../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from './authorization.service';

/** Crea una señal por permiso; se actualizan cuando cambia el perfil de sesión. */
export function usePermissions<T extends Record<string, PermissionCode>>(
  systemCode: string,
  codes: T,
): { [K in keyof T]: Signal<boolean> } {
  const authorization = inject(AuthorizationService);
  const permissions = {} as { [K in keyof T]: Signal<boolean> };

  for (const key in codes) {
    permissions[key] = computed(() => authorization.hasPermission(systemCode, codes[key]));
  }

  return permissions;
}
