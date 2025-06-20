// components/ProductSkeleton.jsx
import React from 'react';

const ProductSkeleton = ({ viewMode }) => {
  const skeletonCards = Array.from({ length: 12 }, (_, i) => (
    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-4 w-4 bg-gray-300 rounded"></div>
        <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="h-8 bg-gray-300 rounded"></div>
        <div className="flex space-x-2">
          <div className="h-8 bg-gray-300 rounded flex-1"></div>
          <div className="h-8 bg-gray-300 rounded flex-1"></div>
        </div>
      </div>
    </div>
  ));

  return (
    <div className={`grid gap-6 ${
      viewMode === 'grid' 
        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
        : 'grid-cols-1'
    }`}>
      {skeletonCards}
    </div>
  );
};

export default ProductSkeleton;
