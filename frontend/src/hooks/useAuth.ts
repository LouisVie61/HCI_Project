import { useState, useCallback, useEffect } from 'react';
import type { User, UserUpdate, AuthResponse } from '../types';
import { authApi } from '../api/endpoints';
import { AUTH_STORAGE_KEY, USER_STORAGE_KEY } from '../constants';
import { localStorageHelper, errorHandler } from '../utils';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorageHelper.getItem<string>(AUTH_STORAGE_KEY);
      const cachedUser = localStorageHelper.getItem<User>(USER_STORAGE_KEY);

      if (token && cachedUser) {
        setUser(cachedUser);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<User>;
      setUser(customEvent.detail);
    };

    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:user-updated', handleUserUpdated);
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:user-updated', handleUserUpdated);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authApi.login(email, password);

      if (result.error) {
        const appError = errorHandler.getAuthError(result);
        setError(appError.message);
        return false;
      }

      const authData = result.data as AuthResponse;
      localStorageHelper.setItem(AUTH_STORAGE_KEY, authData.access_token);
      localStorageHelper.setItem(USER_STORAGE_KEY, authData.user);
      setUser(authData.user);
      return true;
    } catch (err) {
      const errorMsg = errorHandler.format(err);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authApi.signup(email, password);

      if (result.error) {
        setError(result.error);
        return false;
      }

      const authData = result.data as AuthResponse;
      localStorageHelper.setItem(AUTH_STORAGE_KEY, authData.access_token);
      localStorageHelper.setItem(USER_STORAGE_KEY, authData.user);
      setUser(authData.user);
      return true;
    } catch (err) {
      const errorMsg = errorHandler.format(err);
      setError(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorageHelper.removeItem(AUTH_STORAGE_KEY);
      localStorageHelper.removeItem(USER_STORAGE_KEY);
      setUser(null);
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profile: UserUpdate) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authApi.updateProfile(profile);

      if (result.error) {
        setError(result.error);
        return null;
      }

      const updatedUser = result.data as User;
      localStorageHelper.setItem(USER_STORAGE_KEY, updatedUser);
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: updatedUser }));
      return updatedUser;
    } catch (err) {
      const errorMsg = errorHandler.format(err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadAvatar = useCallback(async (avatar: File) => {
    setLoading(true);
    setError(null);

    try {
      const result = await authApi.uploadAvatar(avatar);

      if (result.error) {
        setError(result.error);
        return null;
      }

      const updatedUser = result.data as User;
      localStorageHelper.setItem(USER_STORAGE_KEY, updatedUser);
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent('auth:user-updated', { detail: updatedUser }));
      return updatedUser;
    } catch (err) {
      const errorMsg = errorHandler.format(err);
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    signup,
    updateProfile,
    uploadAvatar,
    logout,
  };
};
