import React, { useState, useEffect, useCallback } from 'react';
import type { User, UserCreatePayload, UserLoginPayload } from '../types';
import { loginUser, registerUser, getMyProfile } from '../api';
import { AuthContext, type AuthContextType } from './AuthContext';

const TOKEN_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on initial mount if token exists
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userProfile = await getMyProfile();
        if (isMounted) {
          setUser(userProfile);
          setToken(storedToken);
        }
      } catch {
        // Token expired or invalid
        localStorage.removeItem(TOKEN_KEY);
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: UserLoginPayload): Promise<User> => {
    // 1. Obtain token from backend
    const tokenResponse = await loginUser(credentials);
    const accessToken = tokenResponse.access_token;

    // 2. Persist in localStorage for session restoration
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);

    // 3. Fetch authenticated user profile using newly set token
    const userProfile = await getMyProfile();
    setUser(userProfile);

    return userProfile;
  }, []);

  const register = useCallback(async (payload: UserCreatePayload): Promise<User> => {
    // 1. Create account on backend
    const createdUser = await registerUser(payload);

    // 2. Automatically log in user after successful registration
    await login({
      email: payload.email,
      password: payload.password,
    });

    return createdUser;
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
