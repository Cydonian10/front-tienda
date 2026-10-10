export interface Usuario {
  id: string;
  email: string;
  nickName: string;
  emailVerified: boolean;
  active: boolean;
  person: Person;
  roles: {
    id: string;
    name: string;
    inicio: string | null;
    fin: string | null;
  }[];
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
