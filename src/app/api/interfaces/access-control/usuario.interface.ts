export interface Usuario {
  id: string;
  email: string;
  nickName: string;
  emailVerified: boolean;
  active: boolean;
  person: Person;
  roles: UsuarioRole[];
}

export interface UsuarioRole {
  id: string;
  /** Puede no venir en el listado actual de usuarios. */
  roleId?: string;
  name: string;
  inicio: string | null;
  fin: string | null;
}

export interface AddUserRoleDto {
  roleId: string;
  validFrom: string; // YYYY-MM-DD
  validUntil: string | null; // YYYY-MM-DD o sin fecha de vencimiento
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  rol: string;
  validFrom: string;
  validUntil: string | null;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  identityDocument: string;
  dateOfBirth: string; // Formato YYYY-MM-DD
  active: boolean;
}

export interface CreateUserDto {
  nickName: string;
  email: string;
  password: string;
  person: {
    lastName: string;
    firstName: string;
    identityDocument: string;
    dateOfBirth: string; // Formato YYYY-MM-DD
  };
}

export type UpdateUserDto = Partial<Omit<CreateUserDto, 'person'>> & {
  person?: Partial<CreateUserDto['person']>;
};
