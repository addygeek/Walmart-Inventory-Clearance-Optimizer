// hooks/useInteractionMutation.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import ApiService from '../services/api';

const useInteractionMutation = ({ userId, filters, searchTerm, sortBy }) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, actionType }) => {
      return ApiService.addInteraction({
        userId,
        productId,
        actionType,
        quantity: 1,
        timestamp: new Date().toISOString(),
        session_id: `session_${Date.now()}`,
        metadata: { source: 'web_app', device: 'desktop' },
      });
    },

    onMutate: async ({ productId, actionType }) => {
      if (actionType === 'bought') {
        await queryClient.cancelQueries(['products']);

        const previousProducts = queryClient.getQueryData(['products', filters, searchTerm, sortBy]);

        queryClient.setQueryData(['products', filters, searchTerm, sortBy], (old) => {
          if (!old || !old.products) return old;

          return {
            ...old,
            products: old.products.map((product) =>
              product.productId === productId
                ? {
                    ...product,
                    stock: Math.max(0, product.stock - 1),
                    isOptimistic: true,
                  }
                : product
            ),
          };
        });

        return { previousProducts };
      }
    },

    onSuccess: (data, variables) => {
      const { actionType, productId } = variables;

      if (actionType === 'bought') {
        if (data.can_sell && data.stock_updated) {
          queryClient.setQueryData(['products', filters, searchTerm, sortBy], (old) => {
            if (!old || !old.products) return old;

            return {
              ...old,
              products: old.products.map((product) =>
                product.productId === productId
                  ? {
                      ...product,
                      stock: data.new_stock,
                      isOptimistic: false,
                    }
                  : product
              ),
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
      const { actionType } = variables;

      if (actionType === 'bought' && context?.previousProducts) {
        queryClient.setQueryData(['products', filters, searchTerm, sortBy], context.previousProducts);
      }

      if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
        toast.error(`❌ ${error.message}`);
        queryClient.invalidateQueries(['products']);
      } else {
        toast.error(`Failed to record action: ${error.message}`);
      }
    },
  });
};

export default useInteractionMutation;
