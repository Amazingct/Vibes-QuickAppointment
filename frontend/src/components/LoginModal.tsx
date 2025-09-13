import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  XMarkIcon,
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  LockClosedIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const { login, register, verifyOtp, resendOtp, error, validationErrors, clearError, isAuthenticated } = useAuth();

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        username: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      setShowPassword(false);
      setWasAuthenticated(isAuthenticated);
      clearError();
      setOtpMode(false);
      setOtp('');
      setSignupSuccess(false);
    }
  }, [isOpen]); // Only reset when modal opens
  
  // Close modal automatically only on successful login, not on signup
  useEffect(() => {
    if (mode === 'login' && isAuthenticated && !wasAuthenticated && isSubmitting) {
      onClose();
    }
  }, [mode, isAuthenticated, wasAuthenticated, isSubmitting, onClose]);

  // Auto-switch to OTP mode if server indicates verification is needed
  useEffect(() => {
    if (mode === 'login' && error && /(otp|verify)/i.test(error)) {
      setOtpMode(true);
    }
  }, [error, mode]);

  // Handle form input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      clearError();
    }
  }, [error]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setWasAuthenticated(isAuthenticated);
    
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
        onClose(); // Close modal on successful login
      } else {
        const ok = await register(formData.email, formData.username, formData.password, formData.firstName, formData.lastName);
        if (ok) {
          // Stay in modal and prompt verification
          setSignupSuccess(true);
          setMode('login');
          setOtpMode(true);
        }
      }
    } catch (error) {
      // Error is handled by the auth context - don't close modal on error
      console.error(`${mode} failed:`, error);
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
      if (ok) {
        // Attempt auto-login using existing password
        await login(formData.email, formData.password);
        setOtp('');
        setOtpMode(false);
        onClose();
      }
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

  // Fill demo credentials
  const fillDemoCredentials = () => {
    setFormData({
      email: 'test@example.com',
      password: 'testpassword123',
      firstName: '',
      lastName: '',
      username: '',
    } as any);
    setOtpMode(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4 relative z-10">
        <div 
          className="modal-content relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Tabs */}
          <div className="mb-4 border-b border-gray-200">
            <nav className="flex">
              <button
                type="button"
                onClick={() => { setMode('login'); clearError(); setOtpMode(false); }}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); clearError(); setOtpMode(false); }}
                className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 ${mode === 'register' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </nav>
          </div>

          {/* Form */}
          <form onSubmit={otpMode ? handleVerify : handleSubmit} className="space-y-4">
            {signupSuccess && otpMode && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">Account created successfully. Please verify your email with the OTP sent.</p>
              </div>
            )}
            {/* Name fields for registration */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="firstName" className="sr-only">First Name</label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    className={`w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-primary sm:text-sm bg-white relative z-10 ${
                      validationErrors?.first_name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={handleChange}
                    tabIndex={0}
                    autoFocus={mode === 'register'}
                    style={{ position: 'relative', zIndex: 10 }}
                  />
                  {validationErrors?.first_name && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="sr-only">Last Name</label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    className={`w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:border-primary sm:text-sm bg-white relative z-10 ${
                      validationErrors?.last_name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                    tabIndex={0}
                    style={{ position: 'relative', zIndex: 10 }}
                  />
                  {validationErrors?.last_name && (
                    <p className="mt-1 text-xs text-red-600">{validationErrors.last_name}</p>
                  )}
                </div>
              </div>
            )}

            {/* Username Field for registration */}
            {mode === 'register' && (
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className={`w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 sm:text-sm bg-white relative z-10 ${
                      validationErrors?.username 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary'
                    }`}
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    tabIndex={0}
                    style={{ position: 'relative', zIndex: 10 }}
                  />
                </div>
                {validationErrors?.username && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.username}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 sm:text-sm bg-white relative z-10 ${
                    validationErrors?.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-primary focus:border-primary'
                  }`}
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  tabIndex={0}
                  autoFocus={mode === 'login'}
                  style={{ position: 'relative', zIndex: 10 }}
                />
              </div>
              {validationErrors?.email && (
                <p className="mt-1 text-xs text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field (hidden in OTP mode) */}
            {!otpMode && (
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-0">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className={`w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 sm:text-sm bg-white relative z-10 ${
                      validationErrors?.password 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:ring-primary focus:border-primary'
                    }`}
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
                {validationErrors?.password && (
                  <p className="mt-1 text-xs text-red-600">{validationErrors.password}</p>
                )}
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
                  className="w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-white relative z-10"
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

            {/* Error Messages */}
            {error && !validationErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {/* Validation Errors */}
            {validationErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
                <ul className="text-sm text-red-600 space-y-1">
                  {Object.entries(validationErrors).map(([field, message]) => (
                    <li key={field} className="flex items-start">
                      <span className="text-red-500 mr-1">•</span>
                      <span>
                        <span className="font-medium capitalize">
                          {field === 'first_name' ? 'First name' : 
                           field === 'last_name' ? 'Last name' : 
                           field === 'username' ? 'Username' :
                           field}:
                        </span>{' '}
                        {message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {otpMode ? 'Verifying...' : (mode === 'login' ? 'Signing in...' : 'Creating account...')}
                </div>
              ) : (
                otpMode ? 'Verify code' : (mode === 'login' ? 'Sign in' : 'Create account')
              )}
            </button>

            {/* Keep UI minimal */}
          </form>

          {/* OTP entry toggle */}
          {mode === 'login' && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setOtpMode(true)}
                className="text-sm text-gray-700 hover:text-gray-900 underline"
              >
                Have a verification code? Enter OTP
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
