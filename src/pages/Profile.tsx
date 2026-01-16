import { useNavigate } from 'react-router-dom';
import { LogOut, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-600 dark:text-purple-300/70 text-sm mb-8">
            Manage your account settings
          </p>
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl p-8">
            <p className="text-gray-600 dark:text-purple-300">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-orange-400 to-pink-400 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Profile
        </h1>
        <p className="text-gray-600 dark:text-purple-300/70 text-sm mb-8">
          Manage your account settings
        </p>

        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-xl p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <Mail className="text-orange-500 dark:text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-purple-300">Email</p>
                <p className="text-lg text-gray-800 dark:text-purple-100">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <UserIcon className="text-orange-500 dark:text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-purple-300">User ID</p>
                <p className="text-gray-800 dark:text-purple-100 font-mono text-sm">{user.userId}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-orange-200 dark:border-purple-500/30">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
