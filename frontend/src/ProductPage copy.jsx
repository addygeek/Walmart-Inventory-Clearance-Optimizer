// ProductPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Search, Filter, Grid3X3, List, ShoppingCart, Heart,
  Clock, AlertTriangle, TrendingUp, Eye, Plus, Minus,
  Star, Share2, Download, RefreshCw, Settings, X,
  ChevronDown, Package, Calendar, DollarSign, Users,
  BarChart3, Tag, TrendingDown
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
//import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
//import { toast } from 'react-hot-toast';
import ApiService from './services/api';
import { LogOut, User, Wifi, WifiOff } from 'lucide-react';

// Inline Components (to avoid import issues)
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

const ProductCard = ({ 
  product, 
  isSelected, 
  onSelect, 
  onAction, 
  onClick, 
  userRole 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStock, setLocalStock] = useState(product.stock);
  
  // Update local stock when product prop changes
  useEffect(() => {
    setLocalStock(product.stock);
  }, [product.stock]);

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

  // Calculate stock status
  const isOutOfStock = localStock === 0;
  const isLowStock = localStock < 5 && localStock > 0;
  const isOptimistic = product.isOptimistic || isProcessing;

  // Enhanced action handler with real-time updates
  const handleAction = async (productId, actionType) => {
    if (actionType === 'bought') {
      if (isOutOfStock || isProcessing) return;
      
      // Immediate UI update for real-time feel
      setIsProcessing(true);
      setLocalStock(prev => Math.max(0, prev - 1));
      
      try {
        await onAction(productId, actionType);
      } catch (error) {
        // Revert on error
        setLocalStock(product.stock);
        toast.error('Failed to process sale');
      } finally {
        setIsProcessing(false);
      }
    } else {
      onAction(productId, actionType);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-xl ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } ${isOptimistic ? 'opacity-75' : ''} flex flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <motion.input
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(product.productId)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <motion.div 
              whileHover={{ rotate: 5 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center"
            >
              <Package className="h-6 w-6 text-blue-600" />
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

        <div>
          <h3 
            className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={() => onClick(product)}
          >
            {product.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{product.category}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 flex-grow">
        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <div className="flex items-center space-x-2">
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
        </div>

        {/* Stock & Expiry with Real-time Updates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <motion.span 
              key={localStock} // Key change triggers animation
              initial={{ scale: 1.2, color: '#3b82f6' }}
              animate={{ scale: 1, color: 'inherit' }}
              transition={{ duration: 0.3 }}
              className={`text-sm font-medium transition-colors duration-300 ${
                isOutOfStock ? 'text-red-600' :
                isLowStock ? 'text-orange-600' :
                localStock < 50 ? 'text-yellow-600' : 'text-green-600'
              }`}
            >
              {localStock} units
              {isProcessing && (
                <span className="ml-1 text-xs text-blue-500">(updating...)</span>
              )}
            </motion.span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {product.days_to_expiry || 0}d left
            </span>
          </div>
        </div>

        {/* Urgency Indicator */}
        <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getUrgencyColor(product.days_to_expiry || 0)}`}>
          <div className="flex items-center justify-between">
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

        {/* Progress Bar with Animation */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Urgency Score</span>
            <span>{((product.urgency_score || 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(product.urgency_score || 0) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-2 rounded-full transition-all duration-300 ${
                (product.urgency_score || 0) > 0.7 ? 'bg-red-500' :
                (product.urgency_score || 0) > 0.4 ? 'bg-orange-500' :
                'bg-green-500'
              }`}
            />
          </div>
        </div>

        {/* Real-time Stock Warnings */}
        <AnimatePresence>
          {isOutOfStock && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
            >
              <p className="text-sm text-red-700 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Out of Stock - Cannot Sell
              </p>
            </motion.div>
          )}
          
          {isLowStock && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg"
            >
              <p className="text-sm text-orange-700 font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock - Only {localStock} left
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions - Fixed Height at Bottom */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
        <div className="flex flex-col space-y-3">
          {/* Action Buttons Row */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {/* View button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(product.productId, 'viewed')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </motion.button>
              
              {/* Add to cart */}
              <motion.button
                whileHover={!isOutOfStock ? { scale: 1.1 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.9 } : {}}
                onClick={() => !isOutOfStock && handleAction(product.productId, 'added')}
                disabled={isOutOfStock}
                className={`p-2 rounded-lg transition-colors ${
                  isOutOfStock 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
                title={isOutOfStock ? "Out of Stock" : "Add to Cart"}
              >
                <ShoppingCart className="h-4 w-4" />
              </motion.button>

              {/* Favorite */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAction(product.productId, 'favorited')}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Add to Favorites"
              >
                <Heart className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Mark Sold Button - Full Width with Enhanced States */}
          {userRole === 'manager' && (
            <motion.button
              whileHover={!isOutOfStock && !isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isOutOfStock && !isProcessing ? { scale: 0.98 } : {}}
              onClick={() => handleAction(product.productId, 'bought')}
              disabled={isOutOfStock || isProcessing}
              className={`w-full py-2 px-4 text-sm font-medium rounded-lg transition-all duration-300 flex items-center justify-center ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isProcessing
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
              title={
                isOutOfStock ? "Cannot sell - Out of Stock" : 
                isProcessing ? "Processing sale..." : 
                "Mark as Sold"
              }
            >
              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Processing...
                  </motion.div>
                ) : isOutOfStock ? (
                  <motion.span
                    key="out-of-stock"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Out of Stock
                  </motion.span>
                ) : (
                  <motion.span
                    key="mark-sold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Mark as Sold
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};


const StatsCards = ({ products }) => {
  const stats = React.useMemo(() => {
    const total = products.length;
    const urgent = products.filter(p => (p.days_to_expiry || 0) <= 7).length;
    const discounted = products.filter(p => (p.discount || 0) > 0).length;
    const lowStock = products.filter(p => (p.stock || 0) < 10).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const avgDiscount = discounted > 0 
      ? products.filter(p => (p.discount || 0) > 0).reduce((sum, p) => sum + (p.discount || 0), 0) / discounted 
      : 0;

    return [
      {
        title: 'Total Products',
        value: total.toLocaleString(),
        icon: Package,
        color: 'blue',
        change: '+12%',
        changeType: 'positive'
      },
      {
        title: 'Urgent Items',
        value: urgent.toLocaleString(),
        icon: AlertTriangle,
        color: 'red',
        change: `${total > 0 ? ((urgent / total) * 100).toFixed(1) : 0}%`,
        changeType: 'neutral'
      },
      {
        title: 'Discounted Items',
        value: discounted.toLocaleString(),
        icon: TrendingDown,
        color: 'green',
        change: `${(avgDiscount * 100).toFixed(1)}% avg`,
        changeType: 'positive'
      },
      {
        title: 'Low Stock',
        value: lowStock.toLocaleString(),
        icon: BarChart3,
        color: 'orange',
        change: `${total > 0 ? ((lowStock / total) * 100).toFixed(1) : 0}%`,
        changeType: 'negative'
      },
      {
        title: 'Total Value',
        value: `$${(totalValue / 1000).toFixed(1)}K`,
        icon: DollarSign,
        color: 'purple',
        change: '+8.2%',
        changeType: 'positive'
      }
    ];
  }, [products]);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' :
                  stat.changeType === 'negative' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">from last week</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

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
          <button
            onClick={() => onBulkAction('bought')}
            className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
            title="Mark all as sold"
          >
            <Tag className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Sample data generator for testing
const generateSampleData = () => {
  const categories = ['Skincare', 'Health', 'Haircare', 'Oral Care', 'Personal Care'];
  const products = [];
  
  for (let i = 0; i < 50; i++) {
    const daysToExpiry = Math.floor(Math.random() * 180);
    const discount = daysToExpiry <= 7 ? 0.3 : daysToExpiry <= 14 ? 0.2 : daysToExpiry <= 30 ? 0.1 : 0;
    const price = Math.floor(Math.random() * 50) + 5;
    
    products.push({
      productId: i,
      name: `Product ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: price,
      discounted_price: price * (1 - discount),
      discount: discount,
      stock: Math.floor(Math.random() * 100),
      days_to_expiry: daysToExpiry,
      urgency_score: Math.max(0, (30 - daysToExpiry) / 30),
      expiryDate: new Date(Date.now() + daysToExpiry * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return products;
};

const ProductPage = ({ userId, userRole, userName, userPermissions, onLogout}) => {
  // State Management
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [sortBy, setSortBy] = useState('urgency');
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 100],
    expiryDays: [0, 180],
    stockLevel: 'all',
    discountOnly: false,
    urgentOnly: false
  });
useEffect(() => {
    const checkDatabase = async () => {
      try {
        const status = await ApiService.getDatabaseStatus();
        setDatabaseStatus(status);
        console.log('📊 Database Status:', status);
        
        if (status.collections.products === 0) {
          toast.error('Database is empty! Click "Populate Database" to add sample data.');
        }
      } catch (error) {
        console.error('Failed to check database status:', error);
      }
    };

    checkDatabase();
  }, []);

  
  // Sample data - replace with actual API calls
  // const [products] = useState(() => generateSampleData());
   // Function to populate database
  const handlePopulateDatabase = async () => {
    try {
      toast.loading('Populating database...');
      const result = await ApiService.populateDatabase();
      
      if (result.populated) {
        toast.success(`Database populated with ${result.products_count} products!`);
        // Refresh the products
        refetch();
        // Update database status
        const newStatus = await ApiService.getDatabaseStatus();
        setDatabaseStatus(newStatus);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(`Failed to populate database: ${error.message}`);
    }
  };

  // Updated query with database status check
  // const { data: productsResponse, isLoading, error, refetch } = useQuery({
  //   queryKey: ['products', filters, searchTerm, sortBy],
  //   queryFn: async () => {
  //     const params = {
  //       search: searchTerm,
  //       sort: sortBy,
  //       limit: 100,
  //       skip: 0,
  //     };
      
  //     const response = await ApiService.getProducts(params);
      
  //     // Log what type of data we're getting
  //     if (response.database_empty) {
  //       console.warn('⚠️ No real data - database is empty');
  //     } else {
  //       console.log('✅ Real MongoDB data loaded:', response.products.length, 'products');
  //     }
      
  //     return response;
  //   },
  //   refetchInterval: 30000,
  // });

  // Use the response data
  const products = productsResponse?.products || [];
  const isDatabaseEmpty = productsResponse?.database_empty || false;

  // Add database status indicator to your header
  const DatabaseStatusIndicator = () => (
    <div className="flex items-center space-x-4">
      {databaseStatus && (
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${
            databaseStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-gray-600">
            DB: {databaseStatus.collections.products} products
          </span>
        </div>
      )}
      
      {isDatabaseEmpty && (
        <button
          onClick={handlePopulateDatabase}
          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
        >
          Populate Database
        </button>
      )}
    </div>
  );

const queryClient = useQueryClient();

  // Real API calls replacing sample data
  const { data: productsData, isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters, searchTerm, sortBy],
    queryFn: async () => {
      const params = {
        search: searchTerm,
        sort: sortBy,
        limit: 100,
        skip: 0,
        ...(filters.categories.length > 0 && { category: filters.categories.join(',') }),
        ...(filters.discountOnly && { discount_only: 'true' }),
        ...(filters.urgentOnly && { urgent_only: 'true' }),
      };
      
      const response = await ApiService.getProducts(params);
      return response.products || [];
    },
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      const response = await ApiService.getRecommendations(userId, { top_k: 12 });
      return response.recommendations || [];
    },
    enabled: !!userId,
    refetchInterval: 60000, // Update recommendations every minute
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => ApiService.getDashboardAnalytics(),
    enabled: userPermissions?.includes('analytics'),
    refetchInterval: 60000,
  });

  const interactionMutation = useMutation({
    mutationFn: async ({ productId, actionType }) => {
      return ApiService.addInteraction({
        userId,
        productId,
        actionType,
        timestamp: new Date().toISOString(),
        session_id: `session_${Date.now()}`,
        metadata: { source: 'web_app', device: 'desktop' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['recommendations']);
      queryClient.invalidateQueries(['analytics']);
      toast.success('Action recorded successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to record action: ${error.message}`);
    }
  });

  const bulkOperationMutation = useMutation({
    mutationFn: (operationData) => ApiService.bulkOperations(operationData),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['analytics']);
      toast.success('Bulk operation completed successfully!');
    },
    onError: (error) => {
      toast.error(`Bulk operation failed: ${error.message}`);
    }
  });
   const UserHeader = () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>{userName} ({userRole})</span>
      </div>
      
      <button
        onClick={onLogout}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  );

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.categories.length === 0 || 
                             filters.categories.includes(product.category);
      
      const matchesPrice = product.price >= filters.priceRange[0] && 
                          product.price <= filters.priceRange[1];
      
      const matchesDiscount = !filters.discountOnly || product.discount > 0;
      const matchesUrgent = !filters.urgentOnly || product.days_to_expiry <= 7;

      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount && matchesUrgent;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency':
          return b.urgency_score - a.urgency_score;
        case 'price_low':
          return a.discounted_price - b.discounted_price;
        case 'price_high':
          return b.discounted_price - a.discounted_price;
        case 'stock':
          return a.stock - b.stock;
        case 'discount':
          return b.discount - a.discount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, filters, sortBy]);

  // Event Handlers
  const handleProductAction = (productId, actionType) => {
    console.log(`Action: ${actionType} on product ${productId}`);
    toast.success(`Product ${actionType} successfully!`);
  };

  const handleBulkAction = (actionType) => {
    selectedProducts.forEach(productId => {
      handleProductAction(productId, actionType);
    });
    setSelectedProducts(new Set());
  };

  const toggleProductSelection = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.productId)));
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Walmart Clearance Optimizer
              </h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Package className="h-4 w-4" />
                <span>{filteredProducts.length} products</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <StatsCards products={products} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <FilterSidebar 
              filters={filters}
              setFilters={setFilters}
              products={products}
            />
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="urgency">Sort by Urgency</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="stock">Stock Level</option>
                    <option value="discount">Discount %</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  {selectedProducts.size > 0 && (
                    <BulkActions
                      selectedCount={selectedProducts.size}
                      onBulkAction={handleBulkAction}
                      userRole={userRole}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={selectAllProducts}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedProducts.size} selected
                  </span>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductSkeleton viewMode={viewMode} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState searchTerm={searchTerm} />
              ) : (
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                      : 'grid-cols-1'
                  }`}
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.productId}
                      product={product}
                      isSelected={selectedProducts.has(product.productId)}
                      onSelect={toggleProductSelection}
                      onAction={handleProductAction}
                      onClick={setSelectedProduct}
                      userRole={userRole}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
