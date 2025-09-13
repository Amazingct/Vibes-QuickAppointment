import React from 'react';
import type { Service } from '../types/service';

interface ServiceCardProps {
  service: Service;
  onClick?: (service: Service) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(service);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="text-yellow-400">★</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-yellow-400">☆</span>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-gray-300">☆</span>
      );
    }

    return stars;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      {/* Service Image */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {service.images && service.images.length > 0 ? (
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {service.category}
          </span>
        </div>

        {/* Image Count Badge */}
        {service.images && service.images.length > 1 && (
          <div className="absolute top-3 right-3">
            <span className="bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs">
              +{service.images.length - 1} more
            </span>
          </div>
        )}
      </div>

      {/* Service Content */}
      <div className="p-4">
        {/* Title and Price */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1 mr-2">
            {service.title}
          </h3>
          <div className="text-right">
            <p className="text-xl font-bold text-green-600">
              {formatPrice(service.price, service.currency)}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {service.description}
        </p>

        {/* Creator Info */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {service.creator.avatar ? (
              <img
                src={service.creator.avatar}
                alt={service.creator.username}
                className="w-6 h-6 rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 bg-gray-300 rounded-full mr-2 flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  {service.creator.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-sm text-gray-700 font-medium">
              {service.creator.username}
            </span>
          </div>
        </div>

        {/* Rating and Reviews */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-2">
              {renderStars(service.rating)}
            </div>
            <span className="text-sm text-gray-600">
              {service.rating.toFixed(1)} ({service.reviewCount} reviews)
            </span>
          </div>
          
          {/* Status Indicator */}
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-1 ${service.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-xs ${service.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {service.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
