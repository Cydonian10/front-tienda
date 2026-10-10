import { Injectable } from '@angular/core';
import { IconName } from '../../../shared/components/icon/icons';
import { SystemMenuGroup } from '../../models/system-menu.model';

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
  routeFor(systemCode: string): string | null {
    return SYSTEMS[systemCode]?.route ?? null;
  }

  iconFor(systemCode: string): IconName {
    return SYSTEMS[systemCode]?.icon ?? SYSTEM_ICONS[systemCode] ?? 'grid';
  }

  menuFor(systemCode: string): readonly SystemMenuGroup[] {
    return SYSTEMS[systemCode]?.menu ?? [];
  }
}
