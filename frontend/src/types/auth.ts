export type UserRole = 'user' | 'organizer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginPayload {
  email: string;
  password: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}
