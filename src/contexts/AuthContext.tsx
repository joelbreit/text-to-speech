import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Amplify } from 'aws-amplify';
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  resendSignUpCode,
  type SignUpInput,
  type ConfirmSignUpInput,
  type SignInInput,
} from 'aws-amplify/auth';
import { awsConfig } from '../config/aws-config';

// Configure Amplify
Amplify.configure(awsConfig);

interface User {
  email: string;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser({
        email: currentUser.signInDetails?.loginId || '',
        userId: currentUser.userId,
      });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const input: SignInInput = {
        username: email,
        password,
      };
      await signIn(input);
      await checkAuthStatus();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const input: SignUpInput = {
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      };
      const { isSignUpComplete, nextStep } = await signUp(input);
      return {
        requiresConfirmation: !isSignUpComplete && nextStep.signUpStep === 'CONFIRM_SIGN_UP',
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const confirmSignup = async (email: string, code: string) => {
    try {
      const input: ConfirmSignUpInput = {
        username: email,
        confirmationCode: code,
      };
      await confirmSignUp(input);
    } catch (error) {
      console.error('Confirmation error:', error);
      throw error;
    }
  };

  const resendConfirmationCode = async (email: string) => {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      console.error('Resend code error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    confirmSignup,
    resendConfirmationCode,
    logout,
    getAuthToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
