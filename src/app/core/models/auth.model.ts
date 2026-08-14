export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  personId: number;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface JwtUser {
  sub: number;
  personId: number;
  email: string;
  roles: string[];
}
