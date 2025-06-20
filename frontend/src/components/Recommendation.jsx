// RecommendationDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const RecommendationDashboard = ({ userId, userRole }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [clearanceItems, setClearanceItems] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hybrid');
  const [evaluationResults, setEvaluationResults] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
      fetchClearanceRecommendations();
      fetchUserPreferences();
    }
  }, [userId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/recommendations/${userId}?top_k=12&type=hybrid`);
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClearanceRecommendations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recommendations/${userId}?top_k=8&type=clearance&urgency_threshold=7`);
      setClearanceItems(response.data.recommendations);
    } catch (error) {
      console.error('Error fetching clearance recommendations:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-preferences/${userId}`);
      setUserPreferences(response.data.preferred_categories);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  };

  const handleInteraction = async (productId, actionType) => {
    try {
      await axios.post(`${API_BASE_URL}/interaction`, {
        userId,
        productId,
        actionType
      });
      
      // Refresh recommendations after interaction
      setTimeout(() => {
        fetchRecommendations();
        fetchClearanceRecommendations();
        fetchUserPreferences();
      }, 500);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  };

  const evaluateSystem = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/evaluate?k=5`);
      setEvaluationResults(response.data.evaluation_results);
    } catch (error) {
      console.error('Error evaluating system:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (daysToExpiry) => {
    if (daysToExpiry <= 3) return 'bg-red-100 text-red-800 border-red-200';
    if (daysToExpiry <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (daysToExpiry <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getDiscountBadge = (discount) => {
    if (discount > 0) {
      return (
        <span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {(discount * 100).toFixed(0)}% OFF
        </span>
      );
    }
    return null;
  };

  const ProductCard = ({ product, showUrgency = false, showRecommendationScore = false }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded mt-1">
            {product.category}
          </span>
        </div>
        {getDiscountBadge(product.discount)}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Price:</span>
          <div className="text-right">
            {product.discount > 0 ? (
              <>
                <span className="line-through text-gray-400 text-sm">${product.price}</span>
                <span className="text-green-600 font-semibold ml-2">${product.discounted_price.toFixed(2)}</span>
              </>
            ) : (
              <span className="font-semibold">${product.price}</span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Stock:</span>
          <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-green-600'}`}>
            {product.stock} units
          </span>
        </div>
        
        {showUrgency && (
          <div className={`inline-block px-3 py-1 rounded-full text-sm border ${getUrgencyColor(product.days_to_expiry)}`}>
            Expires in {product.days_to_expiry} days
          </div>
        )}
        
        {showRecommendationScore && product.recommendation_score && (
          <div className="text-sm text-gray-600">
            Match Score: {(product.recommendation_score * 100).toFixed(0)}%
          </div>
        )}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleInteraction(product.productId, 'viewed')}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
        >
          👁️ View
        </button>
        <button
          onClick={() => handleInteraction(product.productId, 'added')}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          ➕ Add
        </button>
        <button
          onClick={() => handleInteraction(product.productId, 'skipped')}
          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
        >
          ⏭️ Skip
        </button>
        {userRole === 'manager' && (
          <button
            onClick={() => handleInteraction(product.productId, 'bought')}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            ✅ Mark Sold
          </button>
        )}
      </div>
    </div>
  );

  if (loading && recommendations.length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading recommendations...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Walmart Clearance Optimizer - Smart Recommendations
        </h1>
        <p className="text-gray-600">
          Personalized recommendations for {userId} • Role: {userRole}
        </p>
        
        {userPreferences.length > 0 && (
          <div className="mt-3">
            <span className="text-sm text-gray-600">Your preferred categories: </span>
            {userPreferences.map((category, index) => (
              <span key={index} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2">
                {category}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b mb-6 space-x-1">
        <button
          onClick={() => setActiveTab('hybrid')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'hybrid'
              ? 'bg-blue-500 text-white border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          🎯 Smart Recommendations ({recommendations.length})
        </button>
        <button
          onClick={() => setActiveTab('clearance')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'clearance'
              ? 'bg-red-500 text-white border-b-2 border-red-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          🚨 Urgent Clearance ({clearanceItems.length})
        </button>
        {userRole === 'manager' && (
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`px-4 py-2 font-medium rounded-t-lg ${
              activeTab === 'evaluation'
                ? 'bg-green-500 text-white border-b-2 border-green-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            📊 System Performance
          </button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'hybrid' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Personalized Recommendations
            </h2>
            <button
              onClick={fetchRecommendations}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
          
          {recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recommendations.map((product) => (
                <ProductCard 
                  key={product.productId} 
                  product={product} 
                  showRecommendationScore={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recommendations available. Start interacting with products to get personalized suggestions!
            </div>
          )}
        </div>
      )}

      {activeTab === 'clearance' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">
              🚨 Urgent Clearance Items
            </h2>
            <button
              onClick={fetchClearanceRecommendations}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              disabled={loading}
            >
              🔄 Refresh
            </button>
          </div>
          
          {clearanceItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {clearanceItems.map((product) => (
                <ProductCard 
                  key={product.productId} 
                  product={product} 
                  showUrgency={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No urgent clearance items found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'evaluation' && userRole === 'manager' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              📊 System Performance Evaluation
            </h2>
            <button
              onClick={evaluateSystem}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              disabled={loading}
            >
              {loading ? '⏳ Evaluating...' : '🔍 Run Evaluation'}
            </button>
          </div>
          
          {evaluationResults && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Evaluation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Precision@5</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    {(evaluationResults.avg_precision * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-blue-700">Accuracy of recommendations</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Recall@5</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {(evaluationResults.avg_recall * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-700">Coverage of relevant items</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900">F1-Score</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {(evaluationResults.avg_f1 * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-purple-700">Balanced performance</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900">Coverage</h4>
                  <p className="text-2xl font-bold text-orange-600">
                    {(evaluationResults.coverage * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-orange-700">Catalog diversity</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-medium text-indigo-900">Novelty</h4>
                  <p className="text-2xl font-bold text-indigo-600">
                    {(evaluationResults.avg_novelty * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-indigo-700">Recommendation freshness</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Users Evaluated</h4>
                  <p className="text-2xl font-bold text-gray-600">
                    {evaluationResults.num_users_evaluated}
                  </p>
                  <p className="text-sm text-gray-700">Sample size</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendationDashboard;
