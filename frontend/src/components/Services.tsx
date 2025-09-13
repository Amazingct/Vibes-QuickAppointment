import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Service, ServiceFilters, PaginationInfo } from '../types/service';
import ServiceCard from './ServiceCard';
import SearchAndFilter from './SearchAndFilter';
import Pagination from './Pagination';
import ServiceDetailModal from './ServiceDetailModal';
import BookingModal from './BookingModal';
import CreateServiceModal from './CreateServiceModal';
import { apiService } from '../services/api';

// Dummy generation removed; data comes from backend

const Services: React.FC = () => {
  const { user } = useAuth();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<ServiceFilters>({
    search: '',
    category: 'All Categories',
    username: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const itemsPerPage = 12;

  // Get unique usernames for filter dropdown
  const availableUsernames = useMemo(() => {
    const usernames = Array.from(new Set(allServices.map(service => service.creator.username)));
    return usernames.sort();
  }, [allServices]);

  // Filter services based on current filters
  const filteredServices = useMemo(() => {
    return allServices.filter(service => {
      const matchesSearch = !filters.search || 
        service.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        service.description.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = filters.category === 'All Categories' || 
        service.category === filters.category;
      
      const matchesUsername = !filters.username || 
        service.creator.username === filters.username;
      
      return matchesSearch && matchesCategory && matchesUsername;
    });
  }, [allServices, filters]);

  // Pagination (backend-based)
  const pagination: PaginationInfo = useMemo(() => ({
    currentPage,
    totalPages: Math.ceil(allServices.length / itemsPerPage) || 1,
    totalItems: allServices.length,
    itemsPerPage
  }), [allServices.length, currentPage, itemsPerPage]);

  const currentServices = allServices;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch from backend when filters/page change
  useEffect(() => {
    if (user && user.is_verified === false) {
      return; // Block fetching for unverified accounts
    }
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        const { data } = await apiService.listServices({
          page: currentPage,
          per_page: itemsPerPage,
          search: filters.search || undefined,
          category: filters.category !== 'All Categories' ? filters.category : undefined,
          username: filters.username || undefined,
          is_active: true,
          sort: 'created_at:desc'
        });

        const mapped: Service[] = data.services.map((s: any) => ({
          id: String(s.id),
          title: s.name,
          description: s.description || '',
          category: s.category || 'Other',
          price: s.price ?? 0,
          currency: 'USD',
          images: Array.isArray(s.images) ? s.images : [],
          creator: {
            id: String(s.provider?.id ?? s.user_id),
            username: s.provider?.username ?? 'unknown',
            avatar: s.provider?.avatar_url ?? undefined
          },
          rating: 5,
          reviewCount: 0,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          isActive: !!s.is_active
        }));

        setAllServices(mapped);
      } catch (e) {
        console.error('Failed to fetch services', e);
        setAllServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [filters, currentPage, user?.is_verified]);

  const handleFiltersChange = (newFilters: ServiceFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleBook = (service: Service) => {
    // Close details modal and open booking modal
    setIsModalOpen(false);
    setSelectedService(null);
    setBookingService(service);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Browse Services
              </h1>
              <p className="text-gray-600">
                Discover amazing services from talented creators on our platform
              </p>
            </div>
            <div className="mt-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + Create New Service
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <SearchAndFilter
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableUsernames={availableUsernames}
          isLoading={isLoading}
        />

        {/* Results Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {isLoading ? (
                'Loading services...'
              ) : (
                `Showing ${pagination.totalItems} service${pagination.totalItems !== 1 ? 's' : ''}`
              )}
            </p>
            
            {/* Sort Options (placeholder for future implementation) */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
              <select
                id="sort"
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-300"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {currentServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onClick={handleServiceClick}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search criteria or filters to find what you're looking for.
            </p>
            <button
              onClick={() => handleFiltersChange({ search: '', category: 'All Categories', username: '' })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && currentServices.length > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        )}
      </div>
      {/* Modal */}
      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onBook={handleBook}
        />
      )}
      {bookingService && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => { setIsBookingOpen(false); setBookingService(null); }}
          service={bookingService}
          onConfirm={({ date, time }) => {
            alert(`Booked ${bookingService.title} on ${date} at ${time} (dummy)`);
          }}
        />
      )}
      {isCreateOpen && (
        <CreateServiceModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={() => {
            setCurrentPage(1);
            setFilters({ ...filters });
          }}
        />
      )}
    </div>
  );
};

export default Services;
