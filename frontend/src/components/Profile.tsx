import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCircleIcon, EnvelopeIcon, CalendarDaysIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center space-x-6 mb-8">
          <div className="h-24 w-24 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <UserCircleIcon className="h-12 w-12 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="flex items-center mt-2">
              <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700">
                Status: {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={user.first_name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={user.last_name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <UserCircleIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-semibold text-gray-900">#{user.id}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-semibold text-gray-900">{formatDate(user.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-semibold text-gray-900">{user.updated_at ? formatDate(user.updated_at) : '-'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <CheckBadgeIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-semibold text-green-600">
                {user.is_active ? 'Active Account' : 'Inactive Account'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
