import { Service, signal } from '@angular/core';

import { IconName } from '../../shared/icon/icon';
import { MenuItem } from '../models/menu.model';

const initialMenu: MenuItem[] = [
  { id: 'inicio', label: 'Inicio', icon: 'home', route: '/dashboard' },
  {
    id: 'mantenimiento',
    label: 'Mantenimiento',
    icon: 'folder',
    expanded: true,
    children: [
      { id: 'marcas', label: 'Marcas', icon: 'grid', route: '/mantenimiento/marcas' },
      { id: 'categorias', label: 'Categorías', icon: 'folder', route: '/mantenimiento/categorias' },
      {
        id: 'unidades-medida',
        label: 'Unidades de medida',
        icon: 'queue-list',
        route: '/mantenimiento/unidades-medida',
      },
      { id: 'atributos', label: 'Atributos', icon: 'grid', route: '/mantenimiento/atributos' },
      {
        id: 'base-products',
        label: 'Productos Base',
        icon: 'folder',
        route: '/mantenimiento/base-products',
      },
      { id: 'productos', label: 'Productos', icon: 'swatch', route: '/mantenimiento/productos' },
    ],
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: 'clipboard-check',
    expanded: true,
    children: [{ id: 'cajas', label: 'Cajas', icon: 'table', route: '/operaciones/cajas' }],
  },
  { id: 'mensajes', label: 'Mensajes', icon: 'mail', route: '/mensajes' },
];

@Service()
export class DashboardService {
  private readonly menuSignal = signal<MenuItem[]>(initialMenu);
  readonly menu = this.menuSignal.asReadonly();

  toggleGroup(id: string): void {
    this.menuSignal.update((items) => this.toggle(items, id));
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
}
