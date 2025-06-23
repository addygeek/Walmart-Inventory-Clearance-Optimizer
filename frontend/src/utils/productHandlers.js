// utils/productHandlers.js
import { toast } from 'react-hot-toast';
import ApiService from '../services/api';

// Handles individual product action like "bought"
export const handleProductAction = async ({
    productId,
    actionType,
    userId,
    filters,
    searchTerm,
    sortBy,
    queryClient,
}) => {
    try {
        if (actionType === 'bought') {
            toast.loading('Processing sale...', { id: `sale-${productId}` });
        }

        const response = await ApiService.addInteraction({
            userId,
            productId,
            actionType,
            quantity: 1,
            timestamp: new Date().toISOString(),
            session_id: `session_${Date.now()}`,
            metadata: { source: 'web_app', device: 'desktop' },
        });

        if (actionType === 'bought') {
            toast.dismiss(`sale-${productId}`);

            if (response.can_sell && response.stock_updated) {
                queryClient.setQueryData(['products', filters, searchTerm, sortBy], (oldData) => {
                    if (!oldData || !oldData.products) return oldData;

                    return {
                        ...oldData,
                        products: oldData.products.map((product) =>
                            product.productId === productId
                                ? {
                                    ...product,
                                    stock: response.new_stock,
                                    isOutOfStock: response.new_stock === 0,
                                    isLowStock: response.new_stock < 5 && response.new_stock > 0,
                                }
                                : product
                        ),
                    };
                });

                toast.success(`✅ Product sold! Stock: ${response.new_stock} remaining`);

                if (response.new_stock === 0) {
                    toast.warning('⚠️ Product is now out of stock!', { duration: 4000 });
                } else if (response.new_stock < 5) {
                    toast.warning(`⚠️ Low stock warning: Only ${response.new_stock} left!`, { duration: 4000 });
                }
            } else {
                toast.error(response.error || 'Cannot sell product: Out of stock');
            }
        } else {
            toast.success('Action recorded successfully!');
        }

        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['recommendations']);
    } catch (error) {
        if (actionType === 'bought') {
            toast.dismiss(`sale-${productId}`);
        }

        if (error.message.includes('Insufficient stock') || error.message.includes('out of stock')) {
            toast.error(`❌ ${error.message}`);
            queryClient.invalidateQueries(['products']);
        } else {
            toast.error(`Failed to record action: ${error.message}`);
        }
    }
};

// Handles bulk actions on selected products
export const handleBulkAction = async ({
    actionType,
    selectedProducts,
    setSelectedProducts,
    ...rest
}) => {
    for (const productId of selectedProducts) {
        await handleProductAction({ productId, actionType, ...rest });
    }
    setSelectedProducts(new Set());
};

// Toggles selection of an individual product
export const toggleProductSelection = (productId, selectedProducts, setSelectedProducts) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
        newSelected.delete(productId);
    } else {
        newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
};

// Selects or deselects all products based on current selection
export const selectAllProducts = (filteredProducts, selectedProducts, setSelectedProducts) => {
    if (selectedProducts.size === filteredProducts.length) {
        setSelectedProducts(new Set());
    } else {
        setSelectedProducts(new Set(filteredProducts.map((p) => p.productId)));
    }
};

// Handles database population
export const handlePopulateDatabase = async ({
    toast,
    ApiService,
    refetch,
    setDatabaseStatus,
}) => {
    try {
        toast.loading('Populating database...');
        const result = await ApiService.populateDatabase();

        if (result.populated) {
            toast.success(`Database populated with ${result.products_count} products!`);
            await refetch();
            const newStatus = await ApiService.getDatabaseStatus();
            setDatabaseStatus(newStatus);
        } else {
            toast.info(result.message);
        }
    } catch (error) {
        toast.error(`Failed to populate database: ${error.message}`);
    }
};
