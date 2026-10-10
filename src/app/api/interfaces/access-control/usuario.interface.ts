export interface Usuario {
  id: string;
  email: string;
  nickName: string;
  emailVerified: boolean;
  active: boolean;
  person: Person;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  identityDocument: string;
  dateOfBirth: string; // Formato YYYY-MM-DD
  active: boolean;
}
