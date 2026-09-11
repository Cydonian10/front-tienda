export interface Role {
  id: number;
  name: string;
}

export interface PersonAuth {
  id: number;
  email: string;
  google: boolean;
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
  address: string;
  dni: string;
  roles: Role[];
  hasAuth: boolean;
  auth: PersonAuth | null;
}

export interface PersonFilter extends PaginationQuery {
  roleName?: string;
  hasAuth?: boolean;
}
import { PaginationQuery } from './pagination.model';
