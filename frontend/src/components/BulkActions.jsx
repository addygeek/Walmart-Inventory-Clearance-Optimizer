// components/BulkActions.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Archive, Tag } from 'lucide-react';

const BulkActions = ({ selectedCount, onBulkAction, userRole }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-2"
    >
      <span className="text-sm font-medium text-blue-900 px-2">
        {selectedCount} selected
      </span>
      
      <div className="flex space-x-1">
        <button
          onClick={() => onBulkAction('added')}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
          title="Add all to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
        
        {userRole === 'manager' && (
          <>
            <button
              onClick={() => onBulkAction('bought')}
              className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
              title="Mark all as sold"
            >
              <Tag className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onBulkAction('archived')}
              className="p-2 text-orange-600 hover:bg-orange-100 rounded-md transition-colors"
              title="Archive all"
            >
              <Archive className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default BulkActions;
