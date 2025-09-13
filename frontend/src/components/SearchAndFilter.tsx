import React from 'react';
import type { ServiceFilters } from '../types/service';
import { SERVICE_CATEGORIES } from '../types/service';

interface SearchAndFilterProps {
  filters: ServiceFilters;
  onFiltersChange: (filters: ServiceFilters) => void;
  availableUsernames: string[];
  isLoading?: boolean;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  filters,
  onFiltersChange,
  availableUsernames,
  isLoading = false
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: e.target.value
    });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      category: e.target.value
    });
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      username: e.target.value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      category: 'All Categories',
      username: ''
    });
  };

  const hasActiveFilters = filters.search || filters.category !== 'All Categories' || filters.username;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Services
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by title or description..."
              disabled={isLoading}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="lg:w-64">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={handleCategoryChange}
            disabled={isLoading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Username Filter */}
        <div className="lg:w-64">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Creator
          </label>
          <select
            id="username"
            value={filters.username}
            onChange={handleUsernameChange}
            disabled={isLoading}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">All Creators</option>
            {availableUsernames.map((username) => (
              <option key={username} value={username}>
                {username}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        <div className="lg:w-auto flex items-end">
          <button
            onClick={clearFilters}
            disabled={!hasActiveFilters || isLoading}
            className="w-full lg:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600 mr-2">Active filters:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{filters.search}"
                <button
                  onClick={() => onFiltersChange({ ...filters, search: '' })}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.category !== 'All Categories' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Category: {filters.category}
                <button
                  onClick={() => onFiltersChange({ ...filters, category: 'All Categories' })}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-green-400 hover:text-green-600"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.username && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Creator: {filters.username}
                <button
                  onClick={() => onFiltersChange({ ...filters, username: '' })}
                  className="ml-1 inline-flex items-center justify-center w-4 h-4 text-purple-400 hover:text-purple-600"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
