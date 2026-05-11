'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, User } from './api-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, name: string, password: string, phone?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<User>;
  updateProfile: (updates: { name?: string; phone?: string; avatarUrl?: string }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if token exists and load user on mount
  useEffect(() => {
    const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const isTransientNetworkError = (error: unknown) => {
      if (!error || typeof error !== 'object') return false;
      const maybeAxios = error as {
        message?: string;
        code?: string;
        response?: { status?: number };
      };
      const status = maybeAxios.response?.status;
      // DB down / overloaded — keep session; user can retry when API recovers
      if (status === 503) return true;
      return (
        maybeAxios.message === 'Network Error' ||
        maybeAxios.code === 'ECONNABORTED' ||
        (!maybeAxios.response && typeof maybeAxios.message === 'string')
      );
    };

    const checkAuth = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Fetch current user (retry a couple of times for transient dev restarts/network hiccups)
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const currentUser = await apiClient.getCurrentUser();
            setUser(currentUser);
            return;
          } catch (error) {
            lastError = error;
            if (!isTransientNetworkError(error) || attempt === 2) {
              throw error;
            }
            await wait(300 * (attempt + 1));
          }
        }

        if (lastError) {
          throw lastError;
        }
      } catch (error) {
        if (isTransientNetworkError(error)) {
          // Keep existing token during temporary network blips; user can continue once API recovers.
          console.warn('Auth check temporarily unavailable:', error);
          return;
        }
        console.error('Auth check failed:', error);
        apiClient.clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = useCallback(async (email: string, name: string, password: string, phone?: string) => {
    setIsLoading(true);
    try {
      await apiClient.register(email, name, password, phone);
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await apiClient.login(email, password);
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    setIsLoading(true);
    try {
      await apiClient.googleLogin(credential);
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: { name?: string; phone?: string; avatarUrl?: string }) => {
    const updatedUser = await apiClient.updateCurrentUser(updates);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        register,
        login,
        googleLogin,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
