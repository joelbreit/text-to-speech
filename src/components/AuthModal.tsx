import { useState } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'confirm'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, signup, confirmSignup, resendConfirmationCode } = useAuth();

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setConfirmationCode('');
    setError('');
    setSuccessMessage('');
    setMode(defaultMode);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const result = await signup(email, password);
      if (result.requiresConfirmation) {
        setMode('confirm');
        setSuccessMessage('Account created! Please check your email for a verification code.');
      } else {
        handleClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await confirmSignup(email, confirmationCode);
      setSuccessMessage('Email verified! You can now log in.');
      setTimeout(() => {
        setMode('login');
        setSuccessMessage('');
        setConfirmationCode('');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Confirmation failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await resendConfirmationCode(email);
      setSuccessMessage('Verification code resent! Check your email.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-3xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-orange-200 dark:border-purple-500/30">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'confirm' && 'Verify Email'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 dark:text-purple-300 hover:bg-orange-100 dark:hover:bg-purple-800/50 transition-all duration-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/30 rounded-2xl flex items-start space-x-3">
              <AlertCircle className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-500/30 rounded-2xl flex items-start space-x-3">
              <CheckCircle className="text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-purple-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-purple-400" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 hover:from-orange-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-purple-300">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="text-orange-500 dark:text-pink-400 hover:text-orange-600 dark:hover:text-pink-300 font-medium transition-colors duration-300"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-purple-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-purple-400" size={20} />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-purple-400/70">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 hover:from-orange-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating account...' : 'Sign Up'}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-purple-300">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="text-orange-500 dark:text-pink-400 hover:text-orange-600 dark:hover:text-pink-300 font-medium transition-colors duration-300"
                >
                  Log in
                </button>
              </p>
            </form>
          )}

          {mode === 'confirm' && (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-400 dark:text-purple-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-orange-700 dark:text-purple-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-4 py-3 bg-orange-50/50 dark:bg-slate-700/50 border border-orange-200 dark:border-purple-500/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-purple-500 text-gray-800 dark:text-purple-100 placeholder-gray-400 dark:placeholder-purple-400/50 transition-all duration-300 text-center text-lg tracking-widest"
                  placeholder="123456"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 hover:from-orange-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full py-3 px-4 border border-orange-200 dark:border-purple-500/30 hover:bg-orange-50 dark:hover:bg-purple-800/30 text-orange-600 dark:text-purple-300 font-medium rounded-full transition-all duration-300 disabled:bg-gray-100 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                Resend Code
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-purple-300">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-orange-500 dark:text-pink-400 hover:text-orange-600 dark:hover:text-pink-300 font-medium transition-colors duration-300"
                >
                  Back to login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
