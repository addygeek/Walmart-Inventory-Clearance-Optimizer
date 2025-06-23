// hooks/useRecommendationsQuery.js
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';

const useRecommendationsQuery = (userId) => {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn: async () => {
      const response = await ApiService.getRecommendations(userId, { top_k: 12 });
      return response.recommendations || [];
    },
    enabled: !!userId, // only runs if userId is truthy
    refetchInterval: 60000, // refetch every 60 seconds
  });
};

export default useRecommendationsQuery;
