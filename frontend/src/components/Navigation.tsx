import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  HomeIcon,
  BriefcaseIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: HomeIcon
    },
    {
      name: 'Services',
      path: '/services',
      icon: BriefcaseIcon
    },
    {
      name: 'Bookings',
      path: '/bookings',
      icon: CalendarDaysIcon
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: UserCircleIcon
    }
  ];

  const isUnverified = user && user.is_verified === false;
  const isItemDisabled = (name: string) => isUnverified && (name === 'Services' || name === 'Bookings');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <CalendarDaysIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-heading font-bold text-dark-gray">
              QuickAppointment
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const disabled = isItemDisabled(item.name);
              return (
                <Link
                  key={item.path}
                  to={disabled ? '#' : item.path}
                  onClick={(e) => { if (disabled) e.preventDefault(); }}
                  aria-disabled={disabled}
                  title={disabled ? 'Please verify your email to access this section' : undefined}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    disabled
                      ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                      : isActive(item.path)
                        ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-gray transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:block">Logout</span>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="md:hidden border-t border-gray-200 pt-4 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const disabled = isItemDisabled(item.name);
            return (
              <Link
                key={item.path}
                to={disabled ? '#' : item.path}
                onClick={(e) => { if (disabled) e.preventDefault(); }}
                aria-disabled={disabled}
                title={disabled ? 'Please verify your email to access this section' : undefined}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  disabled
                    ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                    : isActive(item.path)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navigation;
