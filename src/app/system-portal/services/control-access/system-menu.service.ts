import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { IconName } from '../../../shared/components/icon/icons';
import { SystemMenuGroup, SystemMenuItem } from '../../models/system-menu.model';

interface FrontendSystem {
  readonly route: string;
  readonly icon: IconName;
  readonly menu: readonly SystemMenuGroup[];
}

const SYSTEMS: Readonly<Record<string, FrontendSystem>> = {
  ACCESS_CONTROL: {
    route: '/admin/access-control',
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
          },
          { label: 'Usuarios', url: '/admin/access-control/usuarios', icon: 'users' },
          { label: 'Permisos', url: '/admin/access-control/permisos', icon: 'key' },
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

  routeFor(systemCode: string): string | null {
    return SYSTEMS[systemCode]?.route ?? null;
  }

  iconFor(systemCode: string): IconName {
    return SYSTEMS[systemCode]?.icon ?? SYSTEM_ICONS[systemCode] ?? 'grid';
  }

  menuFor(systemCode: string): readonly SystemMenuGroup[] {
    return SYSTEMS[systemCode]?.menu ?? [];
  }

  isActiveItem(item: SystemMenuItem): boolean {
    return this.router.isActive(this.router.parseUrl(item.url), {
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
