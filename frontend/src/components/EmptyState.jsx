// components/EmptyState.jsx
import React from 'react';
import { Package, Search } from 'lucide-react';

const EmptyState = ({ searchTerm }) => {
  return (
    <div className="text-center py-12">
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
      {searchTerm && (
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Clear Search
        </button>
      )}
    </div>
  );
};

export default EmptyState;
