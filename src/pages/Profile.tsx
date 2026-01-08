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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">Profile</h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">Profile</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Mail className="text-gray-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg text-gray-800">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <UserIcon className="text-gray-600" size={24} />
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="text-lg text-gray-800 font-mono text-sm">{user.userId}</p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
