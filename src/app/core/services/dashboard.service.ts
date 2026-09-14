import { Service, computed, inject, signal } from '@angular/core';

import { IconName } from '../../shared/icon/icon';
import { MenuItem } from '../models/menu.model';
import { OperationalRole, ROLE_NAMES } from '../models/role.model';
import { AuthStore } from '../store/auth.store';

export type DashboardRole = OperationalRole;

export interface DashboardNavigationLink {
  id: string;
  label: string;
  route: string;
}

const DASHBOARD_ROLE_PRIORITY: readonly DashboardRole[] = [
  ROLE_NAMES.ADMINISTRATOR,
  ROLE_NAMES.RESPONSIBLE,
  ROLE_NAMES.WORKER,
];

export function selectDashboardRole(roles: readonly OperationalRole[]): DashboardRole | null {
  return DASHBOARD_ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null;
}

const initialMenu: MenuItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: 'home',
    route: '/inicio',
    roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
  },
  {
    id: 'ventas',
    label: 'Ventas',
    icon: 'clipboard-check',
    expanded: true,
    roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
    children: [
      {
        id: 'nueva-venta',
        label: 'Nueva venta',
        icon: 'clipboard-check',
        route: '/ventas/nueva',
        roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
      },
      {
        id: 'historial-ventas',
        label: 'Historial',
        icon: 'table',
        route: '/ventas/historial',
        roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
      },
    ],
  },
  {
    id: 'caja',
    label: 'Caja',
    icon: 'table',
    expanded: true,
    roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
    children: [
      {
        id: 'mi-caja',
        label: 'Mi caja',
        icon: 'table',
        route: '/caja/mi-caja',
        roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
      },
      {
        id: 'sesiones-caja',
        label: 'Sesiones',
        icon: 'queue-list',
        route: '/caja/sesiones',
        roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
      },
      {
        id: 'movimientos-caja',
        label: 'Movimientos',
        icon: 'clipboard-check',
        route: '/caja/movimientos',
        roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
      },
    ],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: 'grid',
    route: '/reportes',
    roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
  },
  {
    id: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'folder',
    expanded: true,
    roles: [ROLE_NAMES.ADMINISTRATOR],
    children: [
      {
        id: 'marcas',
        label: 'Marcas',
        icon: 'grid',
        route: '/mantenimiento/marcas',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
      {
        id: 'categorias',
        label: 'Categorías',
        icon: 'folder',
        route: '/mantenimiento/categorias',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
      {
        id: 'unidades-medida',
        label: 'Unidades de medida',
        icon: 'queue-list',
        route: '/mantenimiento/unidades-medida',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
      {
        id: 'atributos',
        label: 'Atributos',
        icon: 'grid',
        route: '/mantenimiento/atributos',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
      {
        id: 'base-products',
        label: 'Productos Base',
        icon: 'folder',
        route: '/mantenimiento/base-products',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
      {
        id: 'productos',
        label: 'Productos',
        icon: 'swatch',
        route: '/mantenimiento/productos',
        roles: [ROLE_NAMES.ADMINISTRATOR],
      },
    ],
  },
  {
    id: 'administracion',
    label: 'Administración',
    icon: 'folder',
    route: '/administracion',
    roles: [ROLE_NAMES.ADMINISTRATOR],
  },
];

@Service()
export class DashboardService {
  private readonly authStore = inject(AuthStore);
  private readonly menuSignal = signal<MenuItem[]>(initialMenu);
  readonly dashboardRole = computed(() => selectDashboardRole(this.authStore.user()?.roles ?? []));
  readonly menu = computed(() =>
    this.filterByRoles(this.menuSignal(), this.authStore.user()?.roles ?? []),
  );

  toggleGroup(id: string): void {
    this.menuSignal.update((items) => this.toggle(items, id));
  }

  authorizedRoutes(ids: readonly string[]): DashboardNavigationLink[] {
    const routes = new Map(
      this.flattenMenu(this.menu()).flatMap((item) =>
        item.route ? [[item.id, { id: item.id, label: item.label, route: item.route }] as const] : [],
      ),
    );
    return ids.flatMap((id) => {
      const route = routes.get(id);
      return route ? [route] : [];
    });
  }

  private filterByRoles(items: MenuItem[], userRoles: OperationalRole[]): MenuItem[] {
    return items.flatMap((item) => {
      if (item.roles && !item.roles.some((role) => userRoles.includes(role))) {
        return [];
      }

      const children = item.children ? this.filterByRoles(item.children, userRoles) : undefined;
      if (item.children && !children?.length && !item.route) {
        return [];
      }

      return [{ ...item, ...(children ? { children } : {}) }];
    });
  }

  private toggle(items: MenuItem[], id: string): MenuItem[] {
    return items.map((item) => {
      if (item.id === id) {
        return { ...item, expanded: !item.expanded };
      }
      if (item.children?.length) {
        return { ...item, children: this.toggle(item.children, id) };
      }
      return item;
    });
  }

  private flattenMenu(items: MenuItem[]): MenuItem[] {
    return items.flatMap((item) => [item, ...(item.children ? this.flattenMenu(item.children) : [])]);
  }
}
