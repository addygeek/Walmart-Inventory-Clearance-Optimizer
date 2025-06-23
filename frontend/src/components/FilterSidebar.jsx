import React from 'react';
import { motion } from 'framer-motion';
import { Filter, DollarSign, Package, Tag } from 'lucide-react';

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
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl shadow-md p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-blue-600" />
          Filters
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
        >
          Clear All
        </motion.button>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <Tag className="h-4 w-4 mr-2 text-purple-600" />
          Categories
        </label>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scroll">
          {categories.map(category => (
            <motion.label
              key={category}
              className="flex items-center cursor-pointer hover:text-blue-600"
              whileHover={{ x: 4 }}
            >
              <input
                type="checkbox"
                checked={filters.categories.includes(category)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...filters.categories, category]
                    : filters.categories.filter(c => c !== category);
                  updateFilter('categories', newCategories);
                }}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">{category}</span>
            </motion.label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          Price Range
        </label>
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max="100"
            value={filters.priceRange[1]}
            onChange={(e) => updateFilter('priceRange', [0, parseInt(e.target.value)])}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>$0</span>
            <span>${filters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3 pt-2">
        <motion.label
          className="flex items-center cursor-pointer hover:text-blue-600"
          whileHover={{ x: 4 }}
        >
          <input
            type="checkbox"
            checked={filters.discountOnly}
            onChange={(e) => updateFilter('discountOnly', e.target.checked)}
            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="ml-2 text-sm text-gray-700">Discounted Items Only</span>
        </motion.label>

        <motion.label
          className="flex items-center cursor-pointer hover:text-red-600"
          whileHover={{ x: 4 }}
        >
          <input
            type="checkbox"
            checked={filters.urgentOnly}
            onChange={(e) => updateFilter('urgentOnly', e.target.checked)}
            className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <span className="ml-2 text-sm text-gray-700">Urgent Items Only (≤7 days)</span>
        </motion.label>
      </div>
    </motion.div>
  );
};

export default FilterSidebar;
