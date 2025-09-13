import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  CalendarDaysIcon, 
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user, resendOtp } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-light-gray via-white to-light-gray flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-dark-gray mb-2">
            Welcome back, {user.first_name}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your QuickAppointment account
          </p>
        </div>

        {/* Verification Banner */}
        {user.is_verified === false && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-yellow-800">
                Your email is not verified. Please Logout and then login again to verify your email to enable Services and Bookings.
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => resendOtp(user.email)} className="px-3 py-1.5 text-sm rounded bg-yellow-600 text-white hover:bg-yellow-700">Resend OTP</button>
              </div>
            </div>
          </div>
        )}

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <UserCircleIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-gray">Profile</h3>
                <p className="text-sm text-gray-500">Your account information</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {user.first_name} {user.last_name}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">
                  Status: {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-gray">Account Details</h3>
                <p className="text-sm text-gray-500">Member since</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="text-lg font-semibold text-dark-gray">#{user.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="text-sm text-gray-700">{formatDate(user.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="h-12 w-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                <CalendarDaysIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-gray">Quick Actions</h3>
                <p className="text-sm text-gray-500">Get started</p>
              </div>
            </div>
            <div className="space-y-3">
              <button className="w-full btn-primary text-sm py-2 disabled:opacity-60" onClick={() => navigate('/services')} disabled={user.is_verified === false}>
                Book Service
              </button>
              <button className="w-full btn-secondary text-sm py-2 disabled:opacity-60" onClick={() => navigate('/services')} disabled={user.is_verified === false}>
                Offer Service
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm disabled:opacity-60" onClick={() => navigate('/bookings')} disabled={user.is_verified === false}>
                View Calendar
              </button>
            </div>
          </div>
        </div>

        {/* User Data JSON (for debugging/development) */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-dark-gray mb-4">User Data (Debug Info)</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-gray-700">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;

