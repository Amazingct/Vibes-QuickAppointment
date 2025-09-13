import React, { useEffect, useMemo, useState } from 'react';
import type { Service } from '../types/service';
import { apiService } from '../services/api';

interface ServiceDetailModalProps {
  service: Service;
  isOpen: boolean;
  onClose: () => void;
  onBook?: (service: Service) => void;
}

const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({ service, isOpen, onClose, onBook }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:MM
  const [checking, setChecking] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setSelectedDate('');
      setSelectedTime('');
      setConflict(null);
      setSuccessMsg(null);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasImages = service.images && service.images.length > 0;

  const goPrev = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) => (prev - 1 + service.images.length) % service.images.length);
  };

  const goNext = () => {
    if (!hasImages) return;
    setCurrentImageIndex((prev) => (prev + 1) % service.images.length);
  };

  const handleBook = () => {
    if (onBook) onBook(service);
  };

  const providerId = useMemo(() => Number(service.creator.id), [service.creator.id]);
  const serviceId = useMemo(() => Number(service.id), [service.id]);

  const handleSubmitBooking = async () => {
    setConflict(null);
    setSuccessMsg(null);
    if (!selectedDate || !selectedTime) {
      setConflict('Please select date and time');
      return;
    }
    const iso = `${selectedDate}T${selectedTime}:00Z`;
    try {
      setChecking(true);
      // Check conflicts
      const { data } = await apiService.getBookedSlots({ provider_id: providerId, service_id: serviceId });
      const exists = data.slots.some(s => s.time_booked.startsWith(`${selectedDate}T${selectedTime}`));
      if (exists) {
        setConflict('Selected time is already booked. Please choose another time.');
        return;
      }
      // Create booking
      await apiService.createBooking({ service_id: serviceId, time_booked: iso });
      setSuccessMsg('Booking created successfully!');
    } catch (e) {
      setConflict(e instanceof Error ? e.message : 'Failed to create booking');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal Content */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-semibold text-gray-900">{service.title}</h2>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                {service.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: service.currency }).format(service.price)}
              </span>
              <span>•</span>
              <span>
                {service.rating.toFixed(1)} ({service.reviewCount} reviews)
              </span>
              <span>•</span>
              <span className={service.isActive ? 'text-green-600' : 'text-red-600'}>
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-5 gap-4 max-h-[80vh] overflow-y-auto">
          {/* Images Section */}
          <div className="lg:col-span-3">
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {hasImages ? (
                <img
                  src={service.images[currentImageIndex]}
                  alt={`${service.title} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No images available
                </div>
              )}

              {/* Carousel Controls */}
              {hasImages && service.images.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-60"
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-60"
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {hasImages && service.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {service.images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded-md overflow-hidden border ${
                      idx === currentImageIndex ? 'border-blue-600' : 'border-transparent'
                    }`}
                    aria-label={`Show image ${idx + 1}`}
                  >
                    <img src={img} alt={`thumb-${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-2">
            {/* Provider */}
            <div className="flex items-center mb-4">
              {service.creator.avatar ? (
                <img
                  src={service.creator.avatar}
                  alt={service.creator.username}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
                  <span className="text-sm text-gray-600">
                    {service.creator.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="text-base font-medium text-gray-900">{service.creator.username}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">About this service</h3>
              <p className="text-gray-700 whitespace-pre-line">{service.description}</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
              <div>
                <span className="block text-gray-500">Created</span>
                <span>{new Date(service.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="block text-gray-500">Last updated</span>
                <span>{new Date(service.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Booking Form */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Date</label>
                  <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Time</label>
                  <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
              </div>
              {conflict && <div className="text-sm text-red-600">{conflict}</div>}
              {successMsg && <div className="text-sm text-green-600">{successMsg}</div>}
              <div className="flex items-center gap-3">
                <button onClick={handleSubmitBooking} disabled={checking} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">
                  {checking ? 'Processing...' : 'Book Now'}
                </button>
                <button onClick={onClose} className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-gray-700 bg-white border-gray-300 hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailModal;


