import { Person } from './people.model';
import { RoleName } from './role.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  personId: number;
  roles: RoleName[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface JwtUser {
  sub: number;
  personId: number;
  email: string;
  roles: RoleName[];
}

export interface RestoredSession {
  accessToken: string;
  user: AuthUser;
  person: Person;
}
