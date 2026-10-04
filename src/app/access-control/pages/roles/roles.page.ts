import { Component } from '@angular/core';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  imports: [Icon],
  selector: 'app-roles',
  templateUrl: './roles.page.html',
  host: { class: 'block min-w-0' },
})
export default class RolesPage {
  readonly systems = [
    {
      id: 'inventory',
      code: 'INVENTARIO',
      name: 'Inventario',
      description: 'Productos y control de existencias',
      roleCount: 2,
    },
    {
      id: 'sales',
      code: 'VENTAS',
      name: 'Ventas',
      description: 'Ventas y atención a clientes',
      roleCount: 1,
    },
    {
      id: 'people',
      code: 'RRHH',
      name: 'Recursos Humanos',
      description: 'Usuarios y personal',
      roleCount: 1,
    },
  ];

  readonly selectedSystem = this.systems[0];

  readonly roles = [
    {
      id: 'inventory-supervisor',
      name: 'Supervisor de inventario',
      description: 'Administra productos, existencias y movimientos.',
      code: 'INVENTARIO_SUPERVISOR',
    },
    {
      id: 'inventory-viewer',
      name: 'Consulta de inventario',
      description: 'Consulta productos y niveles de stock.',
      code: 'INVENTARIO_CONSULTA',
    },
  ];

  readonly permissionPreview = {
    roleName: 'Supervisor de inventario',
    roleCode: 'INVENTARIO_SUPERVISOR',
    assignedCount: 3,
    totalCount: 4,
    permissions: [
      {
        id: 'products-read',
        name: 'Consultar productos',
        resource: 'PRODUCTOS',
        action: 'LEER',
        assigned: true,
      },
      {
        id: 'products-create',
        name: 'Crear productos',
        resource: 'PRODUCTOS',
        action: 'CREAR',
        assigned: true,
      },
      {
        id: 'stock-update',
        name: 'Ajustar existencias',
        resource: 'INVENTARIO',
        action: 'EDITAR',
        assigned: false,
      },
      {
        id: 'movements-read',
        name: 'Consultar movimientos',
        resource: 'MOVIMIENTOS',
        action: 'LEER',
        assigned: true,
      },
    ],
    resources: [
      { code: 'PRODUCTOS', selected: 2, total: 2 },
      { code: 'INVENTARIO', selected: 0, total: 1 },
      { code: 'MOVIMIENTOS', selected: 1, total: 1 },
    ],
  };
}
