/**
 * Catálogo central de códigos de permisos usados por la autorización actual.
 * Los valores coinciden con `permissions.code`; un mismo código puede existir
 * en varios sistemas. La autorización debe comprobar código Y sistema.
 */
export const PERMISSION_CODES = {
  USERS_CREATE: 'USUARIOS_CREAR',
  USERS_READ: 'USUARIOS_LEER',
  USERS_UPDATE: 'USUARIOS_EDITAR',
  USERS_STATUS: 'USUARIOS_ESTADO',
  PERSONS_STATUS: 'PERSONAS_ESTADO',
  PERMISSIONS_READ: 'PERMISOS_LEER',
  ROLES_CREATE: 'ROLES_CREAR',
  ROLES_READ: 'ROLES_LEER',
  ROLES_UPDATE: 'ROLES_EDITAR',
  ROLES_DELETE: 'ROLES_ELIMINAR',
  USERS_ASSIGN_ROL: 'USUARIOS_ASIGNAR_ROL',
  ROLES_ASSIGN_PERMISSION: 'ROLES_ASIGNAR_PERMISO',
  SYSTEM_CREATE: 'SISTEMA_CREAR',
  SYSTEM_READ: 'SISTEMA_LEER',
  SYSTEM_UPDATE: 'SISTEMA_EDITAR',
  SYSTEM_STATUS: 'SISTEMA_ESTADO',
  SYSTEM_DELETE: 'SISTEMA_ELIMINAR',
  SYSTEM_ASSIGN_ROLES: 'SISTEMA_ASIGNAR_ROLES',
} as const;

/**
 * Unión de los valores permitidos de `PERMISSION_CODES` (no de sus nombres de
 * propiedad). Por ejemplo, acepta `USUARIOS_CREAR` y evita códigos inventados.
 */
export type PermissionCode = (typeof PERMISSION_CODES)[keyof typeof PERMISSION_CODES];

export interface Permiso {
  id: string;
  name: string;
  systemCode: string;
  systemId: string;
  resourceCode: string; //'MENUS';
  actionCode: string; //'ESTADO';
  code: PermissionCode; // 'MENUS_ESTADO';
}

export interface FilterPermision {
  rolId?: string;
}
