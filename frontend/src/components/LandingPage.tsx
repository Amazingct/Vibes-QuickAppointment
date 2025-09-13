import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserGroupIcon, 
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import LoginModal from './LoginModal';

const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const openLoginModal = (mode: 'login' | 'register' = 'login') => {
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const features = [
    {
      icon: CalendarDaysIcon,
      title: "Easy Scheduling",
      description: "Book services instantly without phone calls or back-and-forth messages"
    },
    {
      icon: ClockIcon,
      title: "Time Management",
      description: "Set your availability and let clients book when you're free"
    },
    {
      icon: UserGroupIcon,
      title: "Dual Role Platform",
      description: "Offer your services while booking from others - all in one place"
    }
  ];

  const benefits = [
    "No more double bookings",
    "24/7 online booking",
    "Unified dashboard",
    "Real-time notifications",
    "Mobile-friendly design"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-light-gray via-white to-light-gray">
      {/* Masterclass Attribution Banner */}
      <div className="w-full bg-indigo-50 border-b border-indigo-200 text-indigo-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center">
          This project was completed by students in the Vibe Coding Masterclass — Build and Deploy in 2 Days.{' '}
          <a
            href="https://curatelearn.com/events?event=f6943be4-b9b2-4b05-b475-896a579d54a8"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline hover:text-indigo-900"
          >
            See more
          </a>
        </div>
      </div>
      {/* Navigation */}
      <nav className={`bg-white/80 backdrop-blur-md border-b border-gray-200 fixed w-full z-50 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-primary" />
              <span className="text-xl font-heading font-bold text-dark-gray">
                QuickAppointment
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => openLoginModal('login')}
                className="btn-secondary"
              >
                Login
              </button>
              <button 
                onClick={() => openLoginModal('register')}
                className="btn-primary"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={`transition-all duration-700 delay-200 ${isVisible ? 'animate-slide-up opacity-100' : 'translate-y-8 opacity-0'}`}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-dark-gray leading-tight mb-6">
                Book Services,
                <span className="hero-gradient bg-clip-text text-transparent"> Offer Services</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The universal booking platform where you can offer your services and book from others. 
                Say goodbye to scheduling conflicts and phone tag.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button 
                  onClick={() => openLoginModal('register')}
                  className="btn-primary flex items-center justify-center group"
                >
                  Get Started
                  <ArrowRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button 
                  onClick={() => openLoginModal('login')}
                  className="btn-secondary"
                >
                  Sign In
                </button>
              </div>

              {/* Benefits List */}
              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={benefit}
                    className={`flex items-center space-x-3 transition-all duration-500 ${isVisible ? 'animate-slide-in opacity-100' : 'translate-x-4 opacity-0'}`}
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    <CheckCircleIcon className="h-5 w-5 text-secondary flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Hero Image/Graphic */}
            <div className={`relative transition-all duration-700 delay-400 ${isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'}`}>
              <div className="relative z-10">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 animate-bounce-gentle">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                        <CalendarDaysIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-dark-gray">Personal Training</h3>
                        <p className="text-sm text-gray-500">Alex Johnson</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-primary">$50/hr</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {['9:00 AM', '2:00 PM', '5:00 PM'].map((time, index) => (
                      <button
                        key={time}
                        className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                          index === 1 
                            ? 'bg-primary text-white' 
                            : 'bg-light-gray text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                  <button className="w-full btn-primary">
                    Book Now
                  </button>
                </div>

                {/* Floating notification */}
                <div className="absolute -top-4 -right-4 bg-secondary text-white p-3 rounded-lg shadow-lg animate-bounce-gentle z-20">
                  <span className="text-sm font-medium">New booking!</span>
                </div>

                {/* Background decoration */}
                <div className="absolute -bottom-8 -left-8 w-32 h-32 hero-gradient rounded-full opacity-20 animate-bounce-gentle"></div>
                <div className="absolute -top-8 -right-12 w-24 h-24 bg-accent rounded-full opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-dark-gray mb-4">
              Everything you need in one platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're offering services or booking them, QuickAppointment makes it simple and efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`bg-light-gray rounded-2xl p-8 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 ${isVisible ? 'animate-slide-up opacity-100' : 'translate-y-8 opacity-0'}`}
                  style={{ animationDelay: `${1000 + index * 200}ms` }}
                >
                  <div className="w-12 h-12 hero-gradient rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-dark-gray mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-6">
            Ready to simplify your scheduling?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Join thousands of service providers and clients who have transformed their booking experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => openLoginModal('register')}
              className="bg-white text-primary hover:bg-gray-50 font-medium py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              Start for Free
            </button>
            <button 
              onClick={() => openLoginModal('login')}
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-medium py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-gray text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <span className="text-lg font-heading font-bold">QuickAppointment</span>
          </div>
          <p className="text-gray-400">
            Universal service booking platform • Made with ❤️ for service providers and clients
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
        initialMode={loginModalMode}
      />
    </div>
  );
};

export default LandingPage;
