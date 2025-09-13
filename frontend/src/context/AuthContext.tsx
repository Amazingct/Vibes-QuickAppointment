import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, AuthContextType, User } from '../types/auth';
import { apiService } from '../services/api';

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_VALIDATION_ERROR'; payload: { message: string; details: Record<string, string> } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  validationErrors: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        validationErrors: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        validationErrors: null,
      };
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        error: action.payload.message,
        validationErrors: action.payload.details,
        isLoading: false,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null, validationErrors: null };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        validationErrors: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const user = await apiService.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.logout();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const response = await apiService.login({ login: email, password });
      dispatch({ type: 'SET_USER', payload: response.data.user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  }, []);

  // Register function
  const register = useCallback(async (email: string, username: string, password: string, firstName: string, lastName: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const response = await apiService.register({ email, username, password, first_name: firstName, last_name: lastName });
      // Do not authenticate user on signup; require OTP verification first
      return true;
    } catch (error) {
      const err = error as Error & { details?: Record<string, string>; errorType?: string };
      if (err.errorType === 'validation_error' && err.details) {
        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { message: err.message, details: err.details } });
        return false;
      } else {
        dispatch({ type: 'SET_ERROR', payload: err.message || 'Registration failed' });
        throw error;
      }
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await apiService.verifyOtp({ email, otp });
      // Do not call /auth/me here because user may not be authenticated yet.
      // Let caller decide to login again after successful verification.
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message || 'OTP verification failed' });
      return false;
    }
  }, []);

  const resendOtp = useCallback(async (email: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await apiService.resendOtp({ email });
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message || 'Resend OTP failed' });
      return false;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await apiService.forgotPassword({ email });
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message || 'Request failed' });
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string): Promise<boolean> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      await apiService.resetPassword({ email, otp, new_password: newPassword });
      return true;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message || 'Reset failed' });
      return false;
    }
  }, []);

  const updateProfile = useCallback(async (payload: Partial<Pick<User, 'first_name' | 'last_name' | 'avatar_url' | 'username'>>): Promise<User | null> => {
    try {
      dispatch({ type: 'CLEAR_ERROR' });
      const res = await apiService.updateProfile(payload);
      const updated = res.data as unknown as User;
      dispatch({ type: 'SET_USER', payload: updated });
      return updated;
    } catch (error) {
      const err = error as Error & { details?: Record<string, string>; errorType?: string };
      if (err.errorType === 'validation_error' && err.details) {
        dispatch({ type: 'SET_VALIDATION_ERROR', payload: { message: err.message, details: err.details } });
        return null;
      }
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Profile update failed' });
      return null;
    }
  }, []);

  // Logout function
  const logout = useCallback((): void => {
    apiService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  // Clear error function
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    verifyOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    updateProfile,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
}
