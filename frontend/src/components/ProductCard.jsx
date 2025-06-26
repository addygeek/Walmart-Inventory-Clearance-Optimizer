// ProductCard.jsx - Component
import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock, ShoppingCart, Eye, Heart,
  Package, Calendar, DollarSign, TrendingDown
} from 'lucide-react';

const ProductCard = ({ 
  product, 
  isSelected, 
  onSelect, 
  onAction, 
  onClick, 
  userRole 
}) => {
  const getUrgencyColor = (daysToExpiry) => {
    if (daysToExpiry <= 3) return 'text-red-600 bg-red-100 border-red-200';
    if (daysToExpiry <= 7) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (daysToExpiry <= 14) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock < 5 && product.stock > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-2xl border transition-all duration-300 shadow-md hover:shadow-xl flex flex-col h-full ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'
      }`}
    >
      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-3">
            <motion.input
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(product.productId)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <motion.div 
              whileHover={{ rotate: 5 }}
              className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
            >
              <Package className="h-5 w-5 text-blue-600" />
            </motion.div>
          </div>
          {product.discount > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center"
            >
              <TrendingDown className="h-3 w-3 mr-1" />
              {(product.discount * 100).toFixed(0)}% OFF
            </motion.div>
          )}
        </div>

        <h3
          onClick={() => onClick(product)}
          className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2"
        >
          {product.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
      </div>

      <div className="p-4 space-y-4 flex-grow">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            {product.discount > 0 ? (
              <>
                <span className="text-lg font-bold text-green-600">
                  ${product.discounted_price?.toFixed(2) || product.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className={`text-sm font-medium ${
              isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : product.stock < 50 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {product.stock} units
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {product.days_to_expiry || 0}d left
            </span>
          </div>
        </div>

        <div className={`px-3 py-2 border rounded-lg text-sm font-medium ${getUrgencyColor(product.days_to_expiry || 0)}`}>
          <div className="flex justify-between items-center">
            <span>
              {(product.days_to_expiry || 0) <= 3 ? 'Critical' :
              (product.days_to_expiry || 0) <= 7 ? 'Urgent' :
              (product.days_to_expiry || 0) <= 14 ? 'Soon' : 'Normal'}
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{product.days_to_expiry || 0} days</span>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Urgency Score</span>
            <span>{((product.urgency_score || 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(product.urgency_score || 0) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className={`h-2 rounded-full ${
                (product.urgency_score || 0) > 0.7 ? 'bg-red-500' :
                (product.urgency_score || 0) > 0.4 ? 'bg-orange-500' : 'bg-green-500'
              }`}
            />
          </div>
        </div>

        {isOutOfStock && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium"
          >
            ⚠️ Out of Stock - Cannot Sell
          </motion.div>
        )}

        {isLowStock && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium"
          >
            ⚠️ Low Stock - Only {product.stock} left
          </motion.div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-full">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction(product.productId, 'viewed')}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-md transition"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.1 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.9 } : {}}
              onClick={() => !isOutOfStock && onAction(product.productId, 'added')}
              disabled={isOutOfStock}
              className={`p-2 rounded-md transition ${
                isOutOfStock ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-green-600 hover:bg-green-100'
              }`}
              title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            >
              <ShoppingCart className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onAction(product.productId, 'favorited')}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-100 rounded-md transition"
              title="Add to Favorites"
            >
              <Heart className="h-4 w-4" />
            </motion.button>
          </div>

          {userRole === 'manager' && (
            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
              onClick={() => !isOutOfStock && onAction(product.productId, 'bought')}
              
              disabled={isOutOfStock}
              className={`w-full py-2 px-4 text-sm font-medium rounded-md ${
                isOutOfStock ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow hover:shadow-lg'
              }`}
              title={isOutOfStock ? 'Cannot sell - Out of Stock' : 'Mark as Sold'}
            >
              {isOutOfStock ? 'Out of Stock' : 'Mark as Sold'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;