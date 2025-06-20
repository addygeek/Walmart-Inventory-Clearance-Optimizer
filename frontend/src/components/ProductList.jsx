import './ProductList.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
  Label
} from 'recharts';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    manufactureDate: '',
    expiryDate: '',
    stock: '',
    category: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
const [categories, setCategories] = useState(['Grocery', 'Dairy', 'Medicines']);
const [newCategory, setNewCategory] = useState('');

const handleAddCategory = () => {
  const trimmed = newCategory.trim();
  if (!trimmed) return toast.error("Please enter a category name.");
  if (categories.includes(trimmed)) return toast.error("Category already exists.");
  setCategories([...categories, trimmed]);
  setNewCategory('');
  toast.success("Category added.");
};

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:3000/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Error fetching products:', err);
      toast.error('Failed to fetch products');
    }
  };

  const handleInputChange = (e) => {
    setNewProduct({ ...newProduct, [e.target.name]: e.target.value });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/products', newProduct);
      setNewProduct({
        name: '',
        price: '',
        manufactureDate: '',
        expiryDate: '',
        stock: '',
        category: ''
      });
      fetchProducts();
      toast.success('✅ Product added');
    } catch (err) {
      console.error('Error adding product:', err);
      toast.error('❌ Failed to add product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('🗑️ Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:3000/products/${id}`);
        fetchProducts();
        toast.success('🧹 Product deleted');
      } catch (err) {
        toast.error('❌ Delete failed');
      }
    }
  };

  const handleDownloadCSV = () => {
    const headers = 'Name,Price,Manufacture Date,Expiry Date,Stock,Category\n';
    const rows = products.map(p =>
      `${p.name},${p.price},${new Date(p.manufactureDate).toLocaleDateString()},${new Date(p.expiryDate).toLocaleDateString()},${p.stock},${p.category}`
    ).join('\n');
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isExpiringSoon = (date) => {
    const today = new Date();
    const expDate = new Date(date);
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    return expDate - today <= oneMonth && expDate > today;
  };

  const isExpired = (date) => {
    return new Date(date) < new Date();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = products.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + parseInt(p.stock || 0);
    return acc;
  }, {});

  const chartArray = Object.keys(chartData).map(cat => ({
    category: cat,
    stock: chartData[cat]
  }));

  return (
    <div className="product-container">
      <h2 className="title">🛒 Product & Expiry Management</h2>

<form onSubmit={handleAddProduct} className="product-form">
  <input
    name="name"
    value={newProduct.name}
    onChange={handleInputChange}
    placeholder="Product Name"
    required
  />

  <input
    name="price"
    value={newProduct.price}
    onChange={handleInputChange}
    type="number"
    step="0.01"
    placeholder="Price (e.g. 199.99)"
    required
  />

  {/* ✅ Manufacture Date with Label */}
  <label htmlFor="manufactureDate">Manufacture Date:</label>
  <input
    id="manufactureDate"
    name="manufactureDate"
    value={newProduct.manufactureDate}
    onChange={handleInputChange}
    type="date"
    placeholder="YYYY-MM-DD"
    required
  />

  {/* ✅ Expiry Date with Label */}
  <label htmlFor="expiryDate">Expiry Date:</label>
  <input
    id="expiryDate"
    name="expiryDate"
    value={newProduct.expiryDate}
    onChange={handleInputChange}
    type="date"
    placeholder="YYYY-MM-DD"
    required
  />

  <input
    name="stock"
    value={newProduct.stock}
    onChange={handleInputChange}
    type="number"
    placeholder="Stock Quantity"
    required
  />

  {/* ✅ Category Dropdown */}
  <br></br>
  <label htmlFor="category">Product Category:</label>
  <select
    id="category"
    name="category"
    value={newProduct.category}
    onChange={handleInputChange}
    required
  >
    <option value="">-- Select Category --</option>
    {categories.map((cat, idx) => (
      <option key={idx} value={cat}>
        {cat}
      </option>
    ))}
  </select>

  {/* ✅ Add New Category Section */}
  <div className="add-category-section">
    <input
      type="text"
      placeholder="Add New Category"
      value={newCategory}
      onChange={(e) => setNewCategory(e.target.value)}
    />
    <button type="button" onClick={handleAddCategory}>
      ➕ Add Category
    </button>
  </div>

  <button type="submit">➕ Add Product</button>
</form>




      <div className="search-download">
        <input
          type="text"
          placeholder="🔍 Search by name or category"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleDownloadCSV}>⬇ Download CSV</button>
      </div>

      <p>
        Total: <strong>{products.length}</strong> |
        Expiring Soon: <strong>{products.filter(p => isExpiringSoon(p.expiryDate)).length}</strong> |
        Expired: <strong>{products.filter(p => isExpired(p.expiryDate)).length}</strong>
      </p>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartArray}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category">
            <Label value="Category" offset={-5} position="insideBottom" />
          </XAxis>
          <YAxis>
            <Label value="Stock" angle={-90} position="insideLeft" />
          </YAxis>
          <Tooltip />
          <Legend />
          <Bar dataKey="stock" fill="#0077cc" />
        </BarChart>
      </ResponsiveContainer>

      <div className="product-list">
        {filteredProducts.length === 0 ? (
          <p>🔍 No matching products found.</p>
        ) : (
          filteredProducts.map(p => {
            const expired = isExpired(p.expiryDate);
            const expiring = isExpiringSoon(p.expiryDate);

            return (
              <div
                key={p._id}
                className={`product-card ${expired ? 'expired' : expiring ? 'expiring-soon' : ''}`}
              >
                <div>
                  <strong>{p.name}</strong> — ₹{p.price} <br />
                  <strong>Mfg:</strong> {new Date(p.manufactureDate).toLocaleDateString()} <br />
                  <strong>Expiry:</strong> {new Date(p.expiryDate).toLocaleDateString()} <br /> <br/>
                  <strong>Stock:</strong> {p.stock} | <strong>Category:</strong> {p.category}
                </div>
                {expired ? (
                  <p className="status expired">❌ Expired</p>
                ) : expiring ? (
                  <p className="status warning">⚠ Expiring Soon</p>
                ) : (
                  <p className="status ok">✅ Fresh</p>
                )}
                <button onClick={() => handleDelete(p._id)}>🗑 Delete</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductList;
