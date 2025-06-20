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
  BarChart3, Tag, TrendingDown, LogOut, User, Wifi, WifiOff
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import ApiService from './services/api';

// Product Card Component with Fixed Layout
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

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock < 5 && product.stock > 0;

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
      } flex flex-col h-full`}
    >
      {/* Header - Fixed Height */}
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

      {/* Content - Flexible Height */}
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

        {/* Stock & Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className={`text-sm font-medium ${
              isOutOfStock ? 'text-red-600' :
              isLowStock ? 'text-orange-600' :
              product.stock < 50 ? 'text-yellow-600' : 'text-green-600'
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

        {/* Progress Bar */}
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

        {/* Stock Warning */}
        {isOutOfStock && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-700 font-medium">⚠️ Out of Stock - Cannot Sell</p>
          </motion.div>
        )}
        
        {isLowStock && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <p className="text-sm text-orange-700 font-medium">⚠️ Low Stock - Only {product.stock} left</p>
          </motion.div>
        )}
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
                onClick={() => onAction(product.productId, 'viewed')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </motion.button>
              
              {/* Add to cart */}
              <motion.button
                whileHover={!isOutOfStock ? { scale: 1.1 } : {}}
                whileTap={!isOutOfStock ? { scale: 0.9 } : {}}
                onClick={() => !isOutOfStock && onAction(product.productId, 'added')}
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
                onClick={() => onAction(product.productId, 'favorited')}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Add to Favorites"
              >
                <Heart className="h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Mark Sold Button - Full Width */}
          {userRole === 'manager' && (
            <motion.button
              whileHover={!isOutOfStock ? { scale: 1.02 } : {}}
              whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
              onClick={() => !isOutOfStock && onAction(product.productId, 'bought')}
              disabled={isOutOfStock}
              className={`w-full py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                isOutOfStock
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
              }`}
              title={isOutOfStock ? "Cannot sell - Out of Stock" : "Mark as Sold"}
            >
              {isOutOfStock ? 'Out of Stock' : 'Mark as Sold'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Stats Cards Component
const StatsCards = ({ products, databaseStatus }) => {
  const stats = useMemo(() => {
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
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
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

// Filter Sidebar Component
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
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Clear All
        </motion.button>
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
              <motion.label 
                key={category} 
                className="flex items-center"
                whileHover={{ x: 5 }}
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
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </motion.label>
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
          <motion.label 
            className="flex items-center"
            whileHover={{ x: 5 }}
          >
            <input
              type="checkbox"
              checked={filters.discountOnly}
              onChange={(e) => updateFilter('discountOnly', e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Discounted Items Only</span>
          </motion.label>
          
          <motion.label 
            className="flex items-center"
            whileHover={{ x: 5 }}
          >
            <input
              type="checkbox"
              checked={filters.urgentOnly}
              onChange={(e) => updateFilter('urgentOnly', e.target.checked)}
              className="h-4 w-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
            />
            <span className="ml-2 text-sm text-gray-700">Urgent Items Only (≤7 days)</span>
          </motion.label>
        </div>
      </div>
    </motion.div>
  );
};

// Bulk Actions Component
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
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onBulkAction('added')}
          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
          title="Add all to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </motion.button>
        
        {userRole === 'manager' && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onBulkAction('bought')}
            className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
            title="Mark all as sold"
          >
            <Tag className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Empty State Component
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

// Product Skeleton Component
const ProductSkeleton = ({ viewMode }) => {
  const skeletonCards = Array.from({ length: 12 }, (_, i) => (
    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-pulse h-96">
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

// Main ProductPage Component
const ProductPage = ({ userId = 'staff_1', userRole = 'staff', userName = 'Staff User', userPermissions = [], onLogout }) => {
  // State Management
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortBy, setSortBy] = useState('urgency');
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 100],
    expiryDays: [0, 180],
    stockLevel: 'all',
    discountOnly: false,
    urgentOnly: false
  });

  const queryClient = useQueryClient();

  // Check database status on mount
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const status = await ApiService.getDatabaseStatus();
        setDatabaseStatus(status);
        if (status.collections.products === 0) {
          toast.error('Database is empty! Click "Populate Database" to add sample data.');
        }
      } catch (error) {
        console.error('Failed to check database status:', error);
      }
    };

    checkDatabase();
  }, []);

  // Test backend connection on component mount
  useEffect(() => {
    const testBackend = async () => {
      try {
        const isConnected = await ApiService.testConnection();
        if (isConnected) {
          toast.success('Connected to backend successfully!');
        } else {
          toast.error('Cannot connect to backend. Please start the server.');
        }
      } catch (error) {
        toast.error('Backend connection failed');
      }
    };

    testBackend();
  }, []);

  // API Queries
  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['products', filters, searchTerm, sortBy],
    queryFn: async () => {
      try {
        const params = {
          search: searchTerm,
          sort: sortBy,
          limit: 100,
          skip: 0,
        };
        const response = await ApiService.getProducts(params);
        return response;
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    },
    retry: 3,
    retryDelay: 1000,
    refetchInterval: 30000,
    onError: (error) => {
      console.error('Products query failed:', error);
      toast.error(`Failed to load products: ${error.message}`);
    }
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      const response = await ApiService.getRecommendations(userId, { top_k: 12 });
      return response.recommendations || [];
    },
    enabled: !!userId,
    refetchInterval: 60000,
  });

  // Mutations
   // Updated mutation with optimistic updates
  const interactionMutation = useMutation({
    mutationFn: async ({ productId, actionType }) => {
      return ApiService.addInteraction({
        userId,
        productId,
        actionType,
        quantity: 1,
        timestamp: new Date().toISOString(),
        session_id: `session_${Date.now()}`,
        metadata: { source: 'web_app', device: 'desktop' }
      });
    },
    onMutate: async ({ productId, actionType }) => {
      // Optimistic update for immediate UI response
      if (actionType === 'bought') {
        await queryClient.cancelQueries(['products']);
        
        const previousProducts = queryClient.getQueryData(['products', filters, searchTerm, sortBy]);
        
        // Optimistically update the stock
        queryClient.setQueryData(['products', filters, searchTerm, sortBy], (old) => {
          if (!old || !old.products) return old;
          
          return {
            ...old,
            products: old.products.map((product) =>
              product.productId === productId
                ? { 
                    ...product, 
                    stock: Math.max(0, product.stock - 1),
                    isOptimistic: true // Flag for optimistic update
                  }
                : product
            )
          };
        });
        
        return { previousProducts };
      }
    },
    onSuccess: (data, variables) => {
      if (variables.actionType === 'bought') {
        if (data.can_sell && data.stock_updated) {
          // Update with actual server response
          queryClient.setQueryData(['products', filters, searchTerm, sortBy], (old) => {
            if (!old || !old.products) return old;
            
            return {
              ...old,
              products: old.products.map((product) =>
                product.productId === variables.productId
                  ? { 
                      ...product, 
                      stock: data.new_stock,
                      isOptimistic: false
                    }
                  : product
              )
            };
          });
          
          toast.success(`✅ Product sold! Stock: ${data.new_stock} remaining`);
        } else {
          toast.error(data.error || 'Cannot sell product');
        }
      } else {
        toast.success('Action recorded successfully!');
      }
      
      queryClient.invalidateQueries(['recommendations']);
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (variables.actionType === 'bought' && context?.previousProducts) {
        queryClient.setQueryData(['products', filters, searchTerm, sortBy], context.previousProducts);
      }
      
      if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
        toast.error(`❌ ${error.message}`);
        queryClient.invalidateQueries(['products']);
      } else {
        toast.error(`Failed to record action: ${error.message}`);
      }
    }
  });

  // Use real data or fallback
  const products = productsResponse?.products || [];
  const isDatabaseEmpty = productsResponse?.database_empty || false;

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
          return (b.urgency_score || 0) - (a.urgency_score || 0);
        case 'price_low':
          return (a.discounted_price || a.price) - (b.discounted_price || b.price);
        case 'price_high':
          return (b.discounted_price || b.price) - (a.discounted_price || a.price);
        case 'stock':
          return a.stock - b.stock;
        case 'discount':
          return (b.discount || 0) - (a.discount || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, filters, sortBy]);

  // Event Handlers
  // const handleProductAction = (productId, actionType) => {
  //   interactionMutation.mutate({ productId, actionType });
  // };

  const handleProductAction = async (productId, actionType) => {
    try {
      // Show loading state for bought action
      if (actionType === 'bought') {
        toast.loading('Processing sale...', { id: `sale-${productId}` });
      }

      const response = await ApiService.addInteraction({
        userId,
        productId,
        actionType,
        quantity: 1, // assuming 1 unit sold
        timestamp: new Date().toISOString(),
        session_id: `session_${Date.now()}`,
        metadata: { source: 'web_app', device: 'desktop' }
      });

      if (actionType === 'bought') {
        toast.dismiss(`sale-${productId}`);
        
        if (response.can_sell && response.stock_updated) {
          // Update the local state immediately for real-time UI update
          queryClient.setQueryData(['products', filters, searchTerm, sortBy], (oldData) => {
            if (!oldData || !oldData.products) return oldData;
            
            return {
              ...oldData,
              products: oldData.products.map((product) =>
                product.productId === productId
                  ? { 
                      ...product, 
                      stock: response.new_stock,
                      // Update stock status indicators
                      isOutOfStock: response.new_stock === 0,
                      isLowStock: response.new_stock < 5 && response.new_stock > 0
                    }
                  : product
              )
            };
          });

          toast.success(`✅ Product sold! Stock: ${response.new_stock} remaining`);
          
          // If stock is now 0, show special message
          if (response.new_stock === 0) {
            toast.warning('⚠️ Product is now out of stock!', { duration: 4000 });
          } else if (response.new_stock < 5) {
            toast.warning(`⚠️ Low stock warning: Only ${response.new_stock} left!`, { duration: 4000 });
          }
        } else {
          toast.error(response.error || 'Cannot sell product: Out of stock');
        }
      } else {
        // For other actions, just show success
        toast.success('Action recorded successfully!');
      }

      // Invalidate queries to refresh data from server (but UI already updated)
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['recommendations']);

    } catch (error) {
      if (actionType === 'bought') {
        toast.dismiss(`sale-${productId}`);
      }
      
      // Handle specific stock errors
      if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
        toast.error(`❌ ${error.message}`);
        // Refresh products to get current stock levels
        queryClient.invalidateQueries(['products']);
      } else {
        toast.error(`Failed to record action: ${error.message}`);
      }
    }
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

  const handlePopulateDatabase = async () => {
    try {
      toast.loading('Populating database...');
      const result = await ApiService.populateDatabase();
      
      if (result.populated) {
        toast.success(`Database populated with ${result.products_count} products!`);
        refetch();
        const newStatus = await ApiService.getDatabaseStatus();
        setDatabaseStatus(newStatus);
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error(`Failed to populate database: ${error.message}`);
    }
  };

  // Database Status Indicator
  const DatabaseStatusIndicator = () => (
    <div className="flex items-center space-x-4">
      {databaseStatus && (
        <div className="flex items-center space-x-2 text-sm">
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`w-2 h-2 rounded-full ${
              databaseStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`} 
          />
          <span className="text-gray-600">
            DB: {databaseStatus.collections.products} products
          </span>
        </div>
      )}
      
      {isDatabaseEmpty && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePopulateDatabase}
          className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
        >
          Populate Database
        </motion.button>
      )}
    </div>
  );

  // User Header
  const UserHeader = () => (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <User className="h-4 w-4" />
        <span>{userName} ({userRole})</span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onLogout}
        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </motion.button>
    </div>
  );

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Connect to Server</h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'Failed to fetch data from the backend'}
          </p>
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
            >
              Try Again
            </motion.button>
            <p className="text-sm text-gray-500">
              Make sure the backend server is running on http://localhost:5000
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Walmart Clearance Optimizer
              </h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Package className="h-4 w-4" />
                <span>{filteredProducts.length} products</span>
              </div>
              <DatabaseStatusIndicator />
            </div>
            
            <div className="flex items-center space-x-4">
              <UserHeader />
              
              <motion.button
                whileHover={{ rotate: 180 }}
                onClick={() => refetch()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Show warning if database is empty */}
      {isDatabaseEmpty && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border-l-4 border-orange-400 p-4"
        >
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Database is empty!</strong> You're seeing no data because the MongoDB database has no products. 
                Click "Populate Database" to add sample data.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <StatsCards products={products} databaseStatus={databaseStatus} />

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            {/* Search */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 mb-6"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </motion.div>

            {/* Filters */}
            <FilterSidebar 
              filters={filters}
              setFilters={setFilters}
              products={products}
            />

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6 mt-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Recommended for You
                </h3>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((product, index) => (
                    <motion.div
                      key={product.productId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => setSelectedProduct(product)}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Controls */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
            >
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={selectAllProducts}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </motion.button>
                  <span className="text-sm text-gray-500">
                    {selectedProducts.size} selected
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Products Grid/List */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductSkeleton viewMode={viewMode} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState 
                  searchTerm={searchTerm} 
                  isDatabaseEmpty={isDatabaseEmpty}
                  onPopulateDatabase={handlePopulateDatabase}
                />
              ) : (
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`grid gap-6 ${
                    viewMode === 'grid' 
                      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                      : 'grid-cols-1'
                  }`}
                >
                  {filteredProducts.map((product, index) => (
                    <motion.div
                      key={product.productId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={product}
                        isSelected={selectedProducts.has(product.productId)}
                        onSelect={toggleProductSelection}
                        onAction={handleProductAction}
                        onClick={setSelectedProduct}
                        userRole={userRole}
                      />
                    </motion.div>
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
