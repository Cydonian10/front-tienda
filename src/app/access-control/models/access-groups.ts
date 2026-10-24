import {
  PERMISSION_CODES as P,
  type PermissionCode,
  type Permiso,
} from '../../api/interfaces/access-control/permision.interface';

export interface AccessGroup {
  id: string;
  systemCode: string;
  name: string;
  description: string;
  codes: readonly PermissionCode[];
}

const catalogRead = [P.PRODUCTS_READ, P.UNIDADES_READ, P.ATRIBUTOS_READ];
const rolesRead = [P.SYSTEM_READ, P.ROLES_READ, P.PERMISSIONS_READ];
const usersRead = [P.SYSTEM_READ, P.USERS_READ, P.ROLES_READ];
const movementsRead = [P.MOVIMIENTOS_READ, P.EXISTENCIAS_READ];

/** Atajos de selección, no nuevas reglas de seguridad. Los IDs reales vienen de la API.
 * Añadir un permiso al backend NO lo concede automáticamente a ningún rol.
 */
export const ACCESS_GROUPS: readonly AccessGroup[] = [
  {
    id: 'catalog-read',
    systemCode: 'INVENTARIO',
    name: 'Consultar catálogo',
    description: 'Ver productos, unidades de medida y atributos.',
    codes: catalogRead,
  },
  {
    id: 'catalog-manage',
    systemCode: 'INVENTARIO',
    name: 'Gestionar catálogo',
    description: 'Consultar, crear y editar productos y sus variantes, unidades y atributos.',
    codes: [
      ...catalogRead,
      P.PRODUCTS_UPDATE,
      P.VARIANTES_CREATE,
      P.UNIDADES_CREATE,
      P.UNIDADES_UPDATE,
      P.UNIDADES_DELETE,
      P.ATRIBUTOS_CREATE,
      P.ATRIBUTOS_UPDATE,
      P.ATRIBUTOS_DELETE,
    ],
  },
  {
    id: 'purchases-read',
    systemCode: 'INVENTARIO',
    name: 'Consultar compras',
    description: 'Ver compras y proveedores.',
    codes: [P.COMPRAS_READ, P.PROVEEDORES_READ],
  },
  {
    id: 'purchases-create',
    systemCode: 'INVENTARIO',
    name: 'Registrar compras',
    description: 'Consultar y registrar compras con sus ingresos de inventario.',
    codes: [P.COMPRAS_READ, P.PROVEEDORES_READ, P.COMPRAS_CREATE],
  },
  {
    id: 'stock-read',
    systemCode: 'INVENTARIO',
    name: 'Consultar existencias',
    description: 'Ver cantidades y valoración de las existencias.',
    codes: [P.EXISTENCIAS_READ],
  },
  {
    id: 'movements-read',
    systemCode: 'INVENTARIO',
    name: 'Consultar movimientos',
    description: 'Ver movimientos, historial y existencias.',
    codes: movementsRead,
  },
  {
    id: 'movements-create',
    systemCode: 'INVENTARIO',
    name: 'Registrar movimientos',
    description: 'Consultar y registrar salidas, traslados y ajustes. Puede modificar existencias.',
    codes: [...movementsRead, P.SALIDAS_CREATE, P.TRASLADOS_CREATE, P.AJUSTES_CREATE],
  },
  {
    id: 'warehouses-read',
    systemCode: 'INVENTARIO',
    name: 'Consultar almacenes',
    description: 'Ver los almacenes configurados.',
    codes: [P.ALMACENES_READ],
  },
  {
    id: 'warehouses-manage',
    systemCode: 'INVENTARIO',
    name: 'Gestionar almacenes',
    description: 'Consultar, crear y editar almacenes.',
    codes: [P.ALMACENES_READ, P.ALMACENES_CREATE, P.ALMACENES_UPDATE],
  },
  {
    id: 'users-read',
    systemCode: 'ACCESS_CONTROL',
    name: 'Consultar usuarios',
    description: 'Ver usuarios y los roles disponibles, sin modificar sus accesos.',
    codes: usersRead,
  },
  {
    id: 'users-manage',
    systemCode: 'ACCESS_CONTROL',
    name: 'Administrar usuarios',
    description:
      'Crear y editar usuarios, cambiar su estado y asignar o retirar roles. Otorga control sobre accesos.',
    codes: [
      ...usersRead,
      P.USERS_CREATE,
      P.USERS_UPDATE,
      P.USERS_STATUS,
      P.PERSONS_STATUS,
      P.USERS_ASSIGN_ROL,
    ],
  },
  {
    id: 'roles-read',
    systemCode: 'ACCESS_CONTROL',
    name: 'Consultar roles y accesos',
    description: 'Ver roles y las acciones que permite cada uno.',
    codes: rolesRead,
  },
  {
    id: 'roles-manage',
    systemCode: 'ACCESS_CONTROL',
    name: 'Administrar roles y accesos',
    description:
      'Crear, editar y eliminar roles y decidir qué pueden hacer. Otorga control sobre accesos.',
    codes: [
      ...rolesRead,
      P.ROLES_CREATE,
      P.ROLES_UPDATE,
      P.ROLES_DELETE,
      P.ROLES_ASSIGN_PERMISSION,
    ],
  },
  {
    id: 'systems-read',
    systemCode: 'ACCESS_CONTROL',
    name: 'Consultar sistemas',
    description: 'Ver los sistemas disponibles.',
    codes: [P.SYSTEM_READ],
  },
  {
    id: 'systems-manage',
    systemCode: 'ACCESS_CONTROL',
    name: 'Administrar sistemas',
    description: 'Crear y editar sistemas, cambiar su estado o eliminarlos.',
    codes: [P.SYSTEM_READ, P.SYSTEM_CREATE, P.SYSTEM_UPDATE, P.SYSTEM_STATUS, P.SYSTEM_DELETE],
  },
];

export interface AccessGroupState extends AccessGroup {
  ids: string[];
  selected: number;
  checked: boolean;
  partial: boolean;
  available: boolean;
}

export function accessGroupStates(
  permissions: readonly Permiso[],
  selectedIds: ReadonlySet<string>,
  systemCode: string,
): AccessGroupState[] {
  return ACCESS_GROUPS.filter((group) => group.systemCode === systemCode).map((group) => {
    const ids = permissions
      .filter(
        (permission) =>
          permission.systemCode === group.systemCode && group.codes.includes(permission.code),
      )
      .map((permission) => permission.id);
    const selected = ids.filter((id) => selectedIds.has(id)).length;
    const available = group.codes.every((code) =>
      permissions.some(
        (permission) => permission.systemCode === group.systemCode && permission.code === code,
      ),
    );
    return {
      ...group,
      ids,
      selected,
      available,
      checked: available && selected === ids.length,
      partial: selected > 0 && (!available || selected < ids.length),
    };
  });
}

const RESOURCE_LABELS: Readonly<Record<string, string>> = {
  PRODUCTOS: 'Productos',
  UNIDADES: 'Unidades de medida',
  ATRIBUTOS: 'Atributos',
  VARIANTES: 'Variantes',
  ALMACENES: 'Almacenes',
  COMPRAS: 'Compras',
  PROVEEDORES: 'Proveedores',
  EXISTENCIAS: 'Existencias',
  MOVIMIENTOS: 'Movimientos',
  SALIDAS: 'Salidas',
  TRASLADOS: 'Traslados',
  AJUSTES: 'Ajustes',
  USUARIOS: 'Usuarios',
  PERSONAS: 'Personas',
  ROLES: 'Roles',
  PERMISOS: 'Accesos',
  SISTEMA: 'Sistemas',
};

export function resourceLabel(code: string): string {
  return RESOURCE_LABELS[code] ?? code;
}
