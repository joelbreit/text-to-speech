import { Link, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, User } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <BookOpen className="mr-2" size={20} />
                Reader
              </Link>
              <Link
                to="/profile"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/profile')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <User className="mr-2" size={20} />
                Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
