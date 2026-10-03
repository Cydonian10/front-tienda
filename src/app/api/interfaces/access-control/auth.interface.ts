export interface LoginAuthDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthPerfil {
  id: string;
  email: string;
  nickName: string;
  emailVerified: boolean;
  active: boolean;
  person: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    identityDocument: string;
    active: boolean;
  };
  roles: {
    id: string;
    code: string;
    name: string;
    description: string;
  }[];
  permissions: {
    id: string;
    code: string;
    name: string;
    resourceCode: string;
    actionCode: string;
  }[];
}
