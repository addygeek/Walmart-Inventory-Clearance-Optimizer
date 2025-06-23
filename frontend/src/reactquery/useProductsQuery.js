// hooks/useProductsQuery.js
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import ApiService from '../services/api';

const useProductsQuery = ({ filters, searchTerm, sortBy }) => {
  return useQuery({
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
    },
  });
};

export default useProductsQuery;
