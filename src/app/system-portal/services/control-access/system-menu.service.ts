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
            label: 'Roles y accesos',
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
            label: 'Guía de accesos',
            url: '/admin/access-control/permisos',
            icon: 'key',
            permission: PERMISSION_CODES.PERMISSIONS_READ,
          },
        ],
      },
    ],
  },
  INVENTARIO: {
    icon: 'package',
    menu: [
      {
        label: 'Inicio',
        icon: 'chart-line',
        items: [{
          label: 'Resumen',
          url: '/admin/inventario',
          icon: 'chart-line',
          permission: [PERMISSION_CODES.EXISTENCIAS_READ, PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ],
        }],
      },
      {
        label: 'Catálogo',
        icon: 'package',
        items: [
          {
            label: 'Productos',
            url: '/admin/inventario/productos',
            icon: 'package',
            permission: PERMISSION_CODES.PRODUCTS_READ,
          },
          {
            label: 'Marcas',
            url: '/admin/inventario/marcas',
            icon: 'tag',
            permission: PERMISSION_CODES.PRODUCTS_READ,
          },
          {
            label: 'Categorías',
            url: '/admin/inventario/categorias',
            icon: 'tag',
            permission: PERMISSION_CODES.PRODUCTS_READ,
          },
          {
            label: 'Unidades de medida',
            url: '/admin/inventario/unidades',
            icon: 'package',
            permission: PERMISSION_CODES.UNIDADES_READ,
          },
          {
            label: 'Atributos',
            url: '/admin/inventario/atributos',
            icon: 'tag',
            permission: PERMISSION_CODES.ATRIBUTOS_READ,
          },
        ],
      },
      {
        label: 'Operaciones',
        icon: 'package',
        items: [
          {
            label: 'Compras',
            url: '/admin/inventario/compras',
            icon: 'file',
            permission: PERMISSION_CODES.COMPRAS_READ,
          },
          {
            label: 'Proveedores',
            url: '/admin/inventario/proveedores',
            icon: 'users',
            permission: PERMISSION_CODES.PROVEEDORES_READ,
          },
          {
            label: 'Existencias',
            url: '/admin/inventario/existencias',
            icon: 'warehouse',
            permission: PERMISSION_CODES.EXISTENCIAS_READ,
          },
          {
            label: 'Movimientos',
            url: '/admin/inventario/movimientos',
            icon: 'arrows-left-right',
            permission: PERMISSION_CODES.MOVIMIENTOS_READ,
          },
          {
            label: 'Historial',
            url: '/admin/inventario/historial',
            icon: 'file',
            permission: PERMISSION_CODES.MOVIMIENTOS_READ,
          },
        ],
      },
      {
        label: 'Configuración',
        icon: 'settings',
        items: [
          {
            label: 'Almacenes',
            url: '/admin/inventario/almacenes',
            icon: 'warehouse',
            permission: PERMISSION_CODES.ALMACENES_READ,
          },
        ],
      },
    ],
  },
  VENTAS: {
    icon: 'chart-line',
    menu: [
      {
        label: 'Operaciones',
        icon: 'chart-line',
        items: [
          {
            label: 'Cajas y turnos',
            url: '/admin/ventas/cajas-turnos',
            icon: 'chart-line',
            permission: PERMISSION_CODES.CAJAS_TURNOS_READ,
          },
        ],
      },
    ],
  },
};

const SYSTEM_ICONS: Readonly<Record<string, IconName>> = {
  ACCESS_CONTROL: 'shield-check',
  INVENTARIO: 'package',
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
          (Array.isArray(item.permission) ? item.permission : [item.permission]).some((code) =>
            this.authorization.hasPermission(systemCode, code as (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES]),
          ),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }

  isActiveItem(item: SystemMenuItem): boolean {
    const currentUrl = this.router.parseUrl(this.router.url);
    const options = {
      paths: item.url === '/admin/inventario' ? 'exact' : 'subset',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    } as const;
    return containsTree(currentUrl, this.router.parseUrl(item.url), options) ||
      (item.url === '/admin/inventario' &&
        containsTree(currentUrl, this.router.parseUrl('/admin/inventario/resumen'), options));
  }

  isActiveGroup(group: SystemMenuGroup): boolean {
    return group.items.some((item) => this.isActiveItem(item));
  }
}
