export interface SystemRecord {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  order: number;
}

export interface RoleRecord {
  id: string;
  systemId: string;
  code: string;
  name: string;
  description: string;
  permissions: { permissionId: string; active: boolean }[];
}
