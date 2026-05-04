import { MESSAGES } from '../constants';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = {
  getAuthError: (error: any) => {
    if (error?.status === 401) {
      return new AppError('AUTH_FAILED', MESSAGES.ERROR.AUTH_FAILED);
    }
    if (error?.status === 403) {
      return new AppError('UNAUTHORIZED', MESSAGES.ERROR.UNAUTHORIZED);
    }
    return new AppError('UNKNOWN', MESSAGES.ERROR.SERVER_ERROR);
  },

  getNetworkError: () =>
    new AppError('NETWORK_ERROR', MESSAGES.ERROR.NETWORK),

  format: (error: any) => {
    if (error instanceof AppError) {
      return error.message;
    }
    return MESSAGES.ERROR.SERVER_ERROR;
  },
};

export const localStorageHelper = {
  setItem: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  },

  getItem: <T,>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('LocalStorage error:', error);
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  },
};

export const validators = {
  email: (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= 6;
  },

  isNotEmpty: (value: string): boolean => {
    return value.trim().length > 0;
  },
};
