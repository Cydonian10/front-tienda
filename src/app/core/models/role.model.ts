export const ROLE_NAMES = {
  ADMINISTRATOR: 'ADMINISTRADOR',
  RESPONSIBLE: 'RESPONSABLE',
  WORKER: 'TRABAJADOR',
  CUSTOMER: 'CLIENTE',
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];
