export interface LoginAuthDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}
