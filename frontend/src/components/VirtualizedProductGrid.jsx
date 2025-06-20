// components/VirtualizedProductGrid.jsx
import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useWindowSize } from 'react-use';
import ProductCard from './ProductCard';

const VirtualizedProductGrid = ({ 
  products, 
  selectedProducts, 
  onProductSelect, 
  onProductAction, 
  onProductClick, 
  userRole 
}) => {
  const { width, height } = useWindowSize();
  const columnCount = Math.floor((width - 400) / 320); // Adjust based on card width
  const rowCount = Math.ceil(products.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const product = products[index];

    if (!product) return null;

    return (
      <div style={style} className="p-2">
        <ProductCard
          product={product}
          isSelected={selectedProducts.has(product.productId)}
          onSelect={onProductSelect}
          onAction={onProductAction}
          onClick={onProductClick}
          userRole={userRole}
        />
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={320}
      height={600}
      rowCount={rowCount}
      rowHeight={400}
      width={width - 400}
    >
      {Cell}
    </Grid>
  );
};

export default VirtualizedProductGrid;
