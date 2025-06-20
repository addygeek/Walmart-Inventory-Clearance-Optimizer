// components/ProductModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Calendar, DollarSign, BarChart3, Clock, Share2 } from 'lucide-react';
import { format } from 'date-fns';

const ProductModal = ({ product, isOpen, onClose, onAction, userRole }) => {
  if (!product) return null;

  const getUrgencyColor = (daysToExpiry) => {
    if (daysToExpiry <= 3) return 'text-red-600 bg-red-50';
    if (daysToExpiry <= 7) return 'text-orange-600 bg-orange-50';
    if (daysToExpiry <= 14) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Product Details</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* Product Header */}
                <div className="flex items-start space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Package className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-gray-600 mt-1">{product.category}</p>
                    {product.discount > 0 && (
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {(product.discount * 100).toFixed(0)}% OFF
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Price</span>
                    </div>
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

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Stock</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{product.stock} units</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Expiry Date</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {format(new Date(product.expiryDate), 'MMM dd, yyyy')}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">Days Left</span>
                    </div>
                    <span className={`text-lg font-bold ${
                      product.days_to_expiry <= 7 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {product.days_to_expiry} days
                    </span>
                  </div>
                </div>

                {/* Urgency Indicator */}
                <div className={`p-4 rounded-lg ${getUrgencyColor(product.days_to_expiry)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      Urgency Level: {
                        product.days_to_expiry <= 3 ? 'Critical' :
                        product.days_to_expiry <= 7 ? 'High' :
                        product.days_to_expiry <= 14 ? 'Medium' : 'Low'
                      }
                    </span>
                    <span className="text-sm">
                      Score: {(product.urgency_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-white bg-opacity-50 rounded-full h-2">
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

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      onAction(product.productId, 'viewed');
                      onClose();
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Details
                  </button>
                  
                  <button
                    onClick={() => {
                      onAction(product.productId, 'added');
                      onClose();
                    }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Add to Cart
                  </button>

                  {userRole === 'manager' && (
                    <button
                      onClick={() => {
                        onAction(product.productId, 'bought');
                        onClose();
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      Mark as Sold
                    </button>
                  )}

                  <button
                    onClick={() => {
                      navigator.share({
                        title: product.name,
                        text: `Check out this product: ${product.name}`,
                        url: window.location.href
                      });
                    }}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
