import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  // const [signupSuccess, setSignupSuccess] = useState(false); // not used in page login

  const { login, verifyOtp, resendOtp, error, clearError } = useAuth();

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await verifyOtp(formData.email, otp);
      if (!ok) return;
      // Auto-login after successful verification
      await login(formData.email, formData.password);
      setOtp('');
      setOtpMode(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await resendOtp(formData.email);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-gray via-white to-light-gray flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-heading font-bold text-dark-gray">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your QuickAppointment account
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={otpMode ? handleVerify : handleSubmit}>
          {signupSuccess && otpMode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">Account created successfully. Please verify your email with the OTP sent.</p>
            </div>
          )}
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white z-10"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  tabIndex={0}
                  autoFocus
                  style={{ position: 'relative', zIndex: 10 }}
                />
              </div>
            </div>

            {/* Password Field */}
            {!otpMode && (
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white z-10"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  tabIndex={0}
                  style={{ position: 'relative', zIndex: 10 }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            )}

            {/* OTP Field */}
            {otpMode && (
              <div>
                <label htmlFor="otp" className="sr-only">OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white z-10"
                  placeholder="Enter verification code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); if (error) clearError(); }}
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                  <button type="button" onClick={handleResend} className="text-blue-600 hover:text-blue-700 underline disabled:opacity-50" disabled={isSubmitting || !formData.email}>
                    Resend code
                  </button>
                  <button type="button" onClick={() => { setOtpMode(false); }} className="hover:text-gray-800">
                    Back to password
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {otpMode ? 'Verifying...' : 'Signing in...'}
                </div>
              ) : (
                otpMode ? 'Verify code' : 'Sign in'
              )}
            </button>
          </div>

          {/* Demo Credentials */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
            <p className="text-xs text-blue-600">
              Email: test@example.com<br />
              Password: testpassword123
            </p>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: 'test@example.com',
                  password: 'testpassword123'
                });
                setOtpMode(false);
              }}
              className="mt-2 text-xs text-blue-700 hover:text-blue-800 underline"
            >
              Fill demo credentials
            </button>
          </div>
        </form>

        {/* Hint to switch to OTP if API requires verification */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setOtpMode(true)}
            className="text-sm text-gray-700 hover:text-gray-900 underline"
          >
            Have a verification code? Enter OTP
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
