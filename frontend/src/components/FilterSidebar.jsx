// components/FilterSidebar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Filter, X, DollarSign, Calendar, Package, Tag } from 'lucide-react';

const FilterSidebar = ({ filters, setFilters, products }) => {
  const categories = [...new Set(products.map(p => p.category))];
  
  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 100],
      expiryDays: [0, 180],
      stockLevel: 'all',
      discountOnly: false,
      urgentOnly: false
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Categories
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categories.map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={(e) => {
                    const newCategories = e.target.checked
                      ? [...filters.categories, category]
                      : filters.categories.filter(c => c !== category);
                    updateFilter('categories', newCategories);
                  }}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Price Range
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.priceRange[1]}
              onChange={(e) => updateFilter('priceRange', [0, parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>$0</span>
              <span>${filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Expiry Days */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Days to Expiry
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="180"
              value={filters.expiryDays[1]}
              onChange={(e) => updateFilter('expiryDays', [0, parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0 days</span>
              <span>{filters.expiryDays[1]} days</span>
            </div>
          </div>
        </div>

        {/* Stock Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Stock Level
          </label>
          <select
            value={filters.stockLevel}
            onChange={(e) => updateFilter('stockLevel', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="low">Low Stock (&lt; 10)</option>
            <option value="medium">Medium Stock (10-49)</option>
            <option value="high">High Stock (50+)</option>
          </select>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.discountOnly}
              onChange={(e) => updateFilter('discountOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Discounted Items Only</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.urgentOnly}
              onChange={(e) => updateFilter('urgentOnly', e.target.checked)}
              className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-700">Urgent Items Only (≤7 days)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
