export interface SystemRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  order: number;
}

export interface Role {
  id: string;
  systemId: string;
  code: string;
  name: string;
  description: string;
  permissions: { permissionId: string; active: boolean }[];
}

export interface FilterRolesDto {
  systemId?: string;
}

export interface CreateRolDto {
  systemId: string;
  name: string;
  description: string;
}

export interface UpdateRolDto {
  rolId: string;
  name: string;
  description: string;
}
