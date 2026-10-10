import { inject, Injectable } from '@angular/core';
import { containsTree, Router } from '@angular/router';
import { IconName } from '../../../shared/components/icon/icons';
import { SystemMenuGroup, SystemMenuItem } from '../../models/system-menu.model';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';

interface FrontendSystem {
  readonly icon: IconName;
  readonly menu: readonly SystemMenuGroup[];
}

const SYSTEMS: Readonly<Record<string, FrontendSystem>> = {
  ACCESS_CONTROL: {
    icon: 'shield-check',
    menu: [
      {
        label: 'Administración',
        icon: 'shield',
        items: [
          {
            label: 'Sistemas y roles',
            url: '/admin/access-control/sistemas-roles',
            icon: 'shield-check',
            permission: PERMISSION_CODES.SYSTEM_READ,
          },
          {
            label: 'Usuarios',
            url: '/admin/access-control/usuarios',
            icon: 'users',
            permission: PERMISSION_CODES.USERS_READ,
          },
          {
            label: 'Permisos',
            url: '/admin/access-control/permisos',
            icon: 'key',
            permission: PERMISSION_CODES.PERMISSIONS_READ,
          },
        ],
      },
    ],
  },
};

const SYSTEM_ICONS: Readonly<Record<string, IconName>> = {
  ACCESS_CONTROL: 'shield-check',
  INVENTORY: 'package',
  SALES: 'chart-line',
};

@Injectable({ providedIn: 'root' })
export class SystemMenuService {
  private readonly router = inject(Router);
  private readonly authorization = inject(AuthorizationService);

  routeFor(systemCode: string): string | null {
    // Entra directamente a la primera página que el usuario puede consultar.
    return this.menuFor(systemCode)[0]?.items[0]?.url ?? null;
  }

  isImplemented(systemCode: string): boolean {
    return Object.hasOwn(SYSTEMS, systemCode);
  }

  iconFor(systemCode: string): IconName {
    return SYSTEMS[systemCode]?.icon ?? SYSTEM_ICONS[systemCode] ?? 'grid';
  }

  menuFor(systemCode: string): readonly SystemMenuGroup[] {
    return (SYSTEMS[systemCode]?.menu ?? [])
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          this.authorization.hasPermission(systemCode, item.permission),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }

  isActiveItem(item: SystemMenuItem): boolean {
    return containsTree(this.router.parseUrl(this.router.url), this.router.parseUrl(item.url), {
      paths: 'subset',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });
  }

  isActiveGroup(group: SystemMenuGroup): boolean {
    return group.items.some((item) => this.isActiveItem(item));
  }
}
