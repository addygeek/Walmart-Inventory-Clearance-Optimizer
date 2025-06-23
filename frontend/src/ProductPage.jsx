import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Search, Grid3X3, List, RefreshCw, Package, TrendingUp } from 'lucide-react';

import ApiService from './services/api';
import ProductCard from './components/ProductCard';
import StatsCards from './components/StatsCards';
import FilterSidebar from './components/FilterSidebar';
import BulkActions from './components/BulkActions';
import EmptyState from './components/EmptyState';
import ProductSkeleton from './components/ProductSkeleton';
import Header from './components/Header';
import useRecommendationsQuery from './reactquery/useRecommendationsQuery';
import useProductsQuery from './reactquery/useProductsQuery';
import {
  handleProductAction,
  handleBulkAction,
  toggleProductSelection,
  selectAllProducts,
  handlePopulateDatabase,
} from './utils/productHandlers';

const ProductPage = ({ userId = 'staff_1', userRole = 'staff', userName = 'Staff User', onLogout }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [sortBy, setSortBy] = useState('urgency');
  const [databaseStatus, setDatabaseStatus] = useState(null);
  const [filters, setFilters] = useState({ categories: [], priceRange: [0, 100], expiryDays: [0, 180], stockLevel: 'all', discountOnly: false, urgentOnly: false });
  const queryClient = useQueryClient();

  const { data: productsResponse, isLoading, refetch } = useProductsQuery({ filters, searchTerm, sortBy });
  const { data: recommendations = [] } = useRecommendationsQuery(userId);

  useEffect(() => {
    ApiService.getDatabaseStatus().then(status => setDatabaseStatus(status));
  }, []);

  const products = productsResponse?.products || [];
  const isDatabaseEmpty = productsResponse?.database_empty || false;

  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category);
      const matchesPrice = product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1];
      const matchesDiscount = !filters.discountOnly || product.discount > 0;
      const matchesUrgent = !filters.urgentOnly || product.days_to_expiry <= 7;
      return matchesSearch && matchesCategory && matchesPrice && matchesDiscount && matchesUrgent;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'urgency': return (b.urgency_score || 0) - (a.urgency_score || 0);
        case 'price_low': return (a.discounted_price || a.price) - (b.discounted_price || b.price);
        case 'price_high': return (b.discounted_price || b.price) - (a.discounted_price || a.price);
        case 'stock': return a.stock - b.stock;
        case 'discount': return (b.discount || 0) - (a.discount || 0);
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
    return filtered;
  }, [products, searchTerm, filters, sortBy]);

  const DatabaseStatusIndicator = () => (
    <div className="flex items-center space-x-4">
      {databaseStatus && (
        <div className="flex items-center space-x-2 text-sm">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className={`w-2 h-2 rounded-full ${databaseStatus.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-600">DB: {databaseStatus.collections.products} products</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 w-full">
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Walmart Clearance Optimizer</h1>
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <Package className="h-4 w-4" />
                <span>{filteredProducts.length} products</span>
              </div>
              <DatabaseStatusIndicator />
            </div>

            <div className="flex items-center space-x-4">
              <Header userName={userName} userRole={userRole} onLogout={onLogout} />
              <motion.button whileHover={{ rotate: 180 }} onClick={() => refetch()} className="p-2 text-gray-400  hover:text-gray-600 transition-colors" disabled={isLoading}>
                <RefreshCw className={`h-4 w-4  ${isLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>
                  <Grid3X3 className="h-4 w-4" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'}`}>
                  <List className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <StatsCards products={products} />

      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-80 flex-shrink-0 lg:sticky lg:top-24 h-fit">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-md p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" />
              </div>
            </motion.div>

            <FilterSidebar filters={filters} setFilters={setFilters} products={products} />

            {recommendations.length > 0 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl shadow-md p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Recommended for You
                </h3>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((product, index) => (
                    <motion.div key={product.productId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                      <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </aside>

          <main className="flex-1 min-w-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 shadow-sm hover:shadow-md transition">
                    <option value="urgency">Sort by Urgency</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                    <option value="stock">Stock Level</option>
                    <option value="discount">Discount %</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  {selectedProducts.size > 0 && (
                    <BulkActions selectedCount={selectedProducts.size} onBulkAction={handleBulkAction} userRole={userRole} />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button whileHover={{ scale: 1.05 }} onClick={selectAllProducts} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                  </motion.button>
                  <span className="text-sm text-gray-500">{selectedProducts.size} selected</span>
                </div>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductSkeleton viewMode={viewMode} />
              ) : filteredProducts.length === 0 ? (
                <EmptyState searchTerm={searchTerm} isDatabaseEmpty={isDatabaseEmpty} onPopulateDatabase={handlePopulateDatabase} />
              ) : (
                <motion.div key={viewMode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' : 'grid-cols-1'}`}>
                  {filteredProducts.map((product, index) => (
                    <motion.div key={product.productId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                      <ProductCard product={product} isSelected={selectedProducts.has(product.productId)} onSelect={toggleProductSelection} onAction={handleProductAction} onClick={() => {}} userRole={userRole} />
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
