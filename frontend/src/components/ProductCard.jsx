// components/ProductCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock, AlertTriangle, ShoppingCart, Eye, Heart,
  Package, Calendar, DollarSign, TrendingDown
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ProductCard = ({ 
  product, 
  isSelected, 
  onSelect, 
  onAction, 
  onClick, 
  userRole 
}) => {
  const getUrgencyColor = (daysToExpiry) => {
    if (daysToExpiry <= 3) return 'text-red-600 bg-red-50 border-red-200';
    if (daysToExpiry <= 7) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (daysToExpiry <= 14) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStockColor = (stock) => {
    if (stock === 0) return 'text-red-600';
    if (stock < 10) return 'text-orange-600';
    if (stock < 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(product.productId)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          
          {product.discount > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center">
              <TrendingDown className="h-3 w-3 mr-1" />
              {(product.discount * 100).toFixed(0)}% OFF
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 
            className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => onClick(product)}
          >
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              {product.discount > 0 ? (
                <>
                  <span className="text-lg font-bold text-green-600">
                    ${product.discounted_price.toFixed(2)}
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
        </div>

        {/* Stock & Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className={`text-sm font-medium ${getStockColor(product.stock)}`}>
              {product.stock} units
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {product.days_to_expiry}d left
            </span>
          </div>
        </div>

        {/* Urgency Indicator */}
        <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getUrgencyColor(product.days_to_expiry)}`}>
          <div className="flex items-center justify-between">
            <span>
              {product.days_to_expiry <= 3 ? 'Critical' :
               product.days_to_expiry <= 7 ? 'Urgent' :
               product.days_to_expiry <= 14 ? 'Soon' : 'Normal'}
            </span>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(product.expiryDate))}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Urgency Score</span>
            <span>{(product.urgency_score * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                product.urgency_score > 0.7 ? 'bg-red-500' :
                product.urgency_score > 0.4 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ width: `${product.urgency_score * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(product.productId, 'viewed')}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(product.productId, 'added')}
              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Add to Cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(product.productId, 'favorited')}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Add to Favorites"
            >
              <Heart className="h-4 w-4" />
            </motion.button>
          </div>

          {userRole === 'manager' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onAction(product.productId, 'bought')}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark Sold
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
