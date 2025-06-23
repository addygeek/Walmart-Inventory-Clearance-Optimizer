// components/EmptyState.jsx
import React from 'react';
import { Package, Search } from 'lucide-react';

const EmptyState = ({ searchTerm, isDatabaseEmpty, onPopulateDatabase }) => {
  if (isDatabaseEmpty) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="h-12 w-12 text-orange-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Database is Empty
        </h3>
        <p className="text-gray-500 mb-6">
          No products found in the database. Click below to populate with sample data.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPopulateDatabase}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Populate Database
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {searchTerm ? (
          <Search className="h-12 w-12 text-gray-400" />
        ) : (
          <Package className="h-12 w-12 text-gray-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {searchTerm ? 'No products found' : 'No products available'}
      </h3>
      <p className="text-gray-500 mb-6">
        {searchTerm 
          ? `We couldn't find any products matching "${searchTerm}". Try adjusting your search or filters.`
          : 'There are no products to display at the moment.'
        }
      </p>
    </motion.div>
  );
};

export default EmptyState;
