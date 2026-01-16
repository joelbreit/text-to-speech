import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const isActive = (path: string) => location.pathname === path;

  const handleShowLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleShowSignup = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <nav className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-6">
              <Link
                to="/"
                className={`inline-flex items-center px-4 py-2 my-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-purple-200 hover:bg-orange-100 dark:hover:bg-purple-800/50'
                }`}
              >
                <BookOpen className="mr-2" size={20} />
                Reader
              </Link>
              {isAuthenticated && (
                <Link
                  to="/profile"
                  className={`inline-flex items-center px-4 py-2 my-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    isActive('/profile')
                      ? 'bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 text-white shadow-md'
                      : 'text-gray-600 dark:text-purple-200 hover:bg-orange-100 dark:hover:bg-purple-800/50'
                  }`}
                >
                  <User className="mr-2" size={20} />
                  Profile
                </Link>
              )}
            </div>

            {!isLoading && (
              <div className="flex items-center space-x-3">
                {!isAuthenticated ? (
                  <>
                    <button
                      onClick={handleShowLogin}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-600 dark:text-purple-300 hover:text-orange-700 dark:hover:text-purple-200 transition-all duration-300"
                    >
                      <LogIn className="mr-2" size={18} />
                      Log In
                    </button>
                    <button
                      onClick={handleShowSignup}
                      className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-500 dark:to-pink-500 hover:from-orange-500 hover:to-pink-500 dark:hover:from-purple-600 dark:hover:to-pink-600 text-white text-sm font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <UserPlus className="mr-2" size={18} />
                      Sign Up
                    </button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </nav>

      <Outlet />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
}
