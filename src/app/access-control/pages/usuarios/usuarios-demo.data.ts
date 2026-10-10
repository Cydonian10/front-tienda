// Datos locales basados en UserResponseDto, PersonResponseDto y UserRoleResponseDto de api-tienda.
// La API de listado de usuarios no devuelve roles; esta vista los relaciona solo para la demo.
export interface DemoUser {
  id: string;
  email: string;
  nickName: string;
  emailVerified: boolean;
  active: boolean;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    identityDocument: string;
    dateOfBirth: string;
    active: boolean;
  };
  roles: DemoAssignment[];
}

export interface DemoSystem {
  id: string;
  code: string;
  name: string;
}

export interface DemoRole {
  id: string;
  systemId: string;
  code: string;
  name: string;
}

export interface DemoAssignment {
  id: string;
  userId: string;
  roleId: string;
  validFrom: string;
  validUntil: string | null;
}

export const DEMO_SYSTEMS: DemoSystem[] = [
  { id: 'system-access', code: 'ACCESS_CONTROL', name: 'Control de acceso' },
  { id: 'system-sales', code: 'SALES', name: 'Ventas' },
  { id: 'system-inventory', code: 'INVENTORY', name: 'Inventario' },
];

export const DEMO_ROLES: DemoRole[] = [
  {
    id: 'role-access-admin',
    systemId: 'system-access',
    code: 'ACCESS_CONTROL_ADMIN',
    name: 'Administrador',
  },
  {
    id: 'role-sales-supervisor',
    systemId: 'system-sales',
    code: 'SALES_SUPERVISOR',
    name: 'Supervisor',
  },
  { id: 'role-sales-operator', systemId: 'system-sales', code: 'SALES_OPERATOR', name: 'Vendedor' },
  {
    id: 'role-inventory-operator',
    systemId: 'system-inventory',
    code: 'INVENTORY_OPERATOR',
    name: 'Operador',
  },
];

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-gabriel',
    email: 'gabriel@example.com',
    nickName: 'gabriel',
    emailVerified: true,
    active: true,
    person: {
      id: 'person-gabriel',
      firstName: 'Gabriel',
      lastName: 'Pérez',
      identityDocument: '12345678',
      dateOfBirth: '1990-01-31',
      active: true,
    },
    roles: [
      {
        id: 'assignment-gabriel-access',
        userId: 'user-gabriel',
        roleId: 'role-access-admin',
        validFrom: '2026-09-12',
        validUntil: null,
      },
      {
        id: 'assignment-gabriel-sales',
        userId: 'user-gabriel',
        roleId: 'role-sales-supervisor',
        validFrom: '2026-09-15',
        validUntil: null,
      },
    ],
  },
  {
    id: 'user-maria',
    email: 'maria.rojas@example.com',
    nickName: 'maria',
    emailVerified: true,
    active: true,
    person: {
      id: 'person-maria',
      firstName: 'María',
      lastName: 'Rojas',
      identityDocument: '44556677',
      dateOfBirth: '1993-05-17',
      active: true,
    },
    roles: [
      {
        id: 'assignment-maria-sales',
        userId: 'user-maria',
        roleId: 'role-sales-operator',
        validFrom: '2026-09-18',
        validUntil: null,
      },
      {
        id: 'assignment-maria-inventory',
        userId: 'user-maria',
        roleId: 'role-inventory-operator',
        validFrom: '2026-09-20',
        validUntil: null,
      },
    ],
  },
  {
    id: 'user-luis',
    email: 'luis.quispe@example.com',
    nickName: 'luis',
    emailVerified: false,
    active: true,
    person: {
      id: 'person-luis',
      firstName: 'Luis',
      lastName: 'Quispe',
      identityDocument: '77889900',
      dateOfBirth: '1988-03-12',
      active: true,
    },
    roles: [
      {
        id: 'assignment-luis-inventory',
        userId: 'user-luis',
        roleId: 'role-inventory-operator',
        validFrom: '2026-09-21',
        validUntil: null,
      },
    ],
  },
  {
    id: 'user-ana',
    email: 'ana.torres@example.com',
    nickName: 'ana',
    emailVerified: false,
    active: false,
    person: {
      id: 'person-ana',
      firstName: 'Ana',
      lastName: 'Torres',
      identityDocument: '55667788',
      dateOfBirth: '1995-11-05',
      active: true,
    },
    roles: [],
  },
];

export const demoFullName = (user: DemoUser) => `${user.person.firstName} ${user.person.lastName}`;
export const demoInitials = (user: DemoUser) =>
  `${user.person.firstName.charAt(0)}${user.person.lastName.charAt(0)}`.toLocaleUpperCase('es');

export const demoToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
