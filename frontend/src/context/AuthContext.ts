import { createContext } from 'react';
import type { User, UserCreatePayload, UserLoginPayload } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLoginPayload) => Promise<User>;
  register: (payload: UserCreatePayload) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
