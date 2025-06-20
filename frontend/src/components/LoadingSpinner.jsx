import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
        />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Walmart Clearance Optimizer
        </h2>
        <p className="text-gray-600">Loading application...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
