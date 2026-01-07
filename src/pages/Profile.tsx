import { useState } from 'react';
import { LogOut, Mail } from 'lucide-react';

export default function Profile() {
  const [email] = useState('user@example.com');

  const handleLogout = () => {
    console.log('Logout clicked');
    alert('Logout functionality will be implemented in Phase 2');
  };

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
                <p className="text-lg text-gray-800">{email}</p>
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
