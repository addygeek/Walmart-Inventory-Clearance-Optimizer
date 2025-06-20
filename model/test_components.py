# test_components.py
import unittest
import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your classes
from recommendation_system import (
    CollaborativeFilter, 
    ContentBasedFilter, 
    HybridRecommendationSystem,
    RecommendationEvaluator,
    generate_sample_data
)

class TestRecommendationComponents(unittest.TestCase):
    
    def setUp(self):
        """Set up test data"""
        print("Setting up test data...")
        self.products_df, self.interactions_df = generate_sample_data()
        print(f"Test data: {len(self.products_df)} products, {len(self.interactions_df)} interactions")
    
    def test_data_generation(self):
        """Test that sample data is generated correctly"""
        self.assertGreater(len(self.products_df), 0)
        self.assertGreater(len(self.interactions_df), 0)
        
        # Check required columns exist
        required_product_cols = ['productId', 'name', 'category', 'price', 'stock', 'days_to_expiry']
        for col in required_product_cols:
            self.assertIn(col, self.products_df.columns)
        
        required_interaction_cols = ['userId', 'productId', 'actionType', 'timestamp']
        for col in required_interaction_cols:
            self.assertIn(col, self.interactions_df.columns)
        
        print("✅ Data generation test passed")
    
    def test_collaborative_filter(self):
        """Test collaborative filtering component"""
        print("Testing collaborative filter...")
        collab_filter = CollaborativeFilter(self.interactions_df)
        
        # Test item-based recommendations
        test_user = "staff_1"
        item_recs = collab_filter.recommend_item_based(test_user, top_k=5)
        
        print(f"Item-based recommendations for {test_user}: {item_recs}")
        self.assertIsInstance(item_recs, list)
        self.assertLessEqual(len(item_recs), 5)
        
        # Test user-based recommendations
        user_recs = collab_filter.recommend_user_based(test_user, top_k=5)
        print(f"User-based recommendations for {test_user}: {user_recs}")
        self.assertIsInstance(user_recs, list)
        
        print("✅ Collaborative filter test passed")
    
    def test_content_based_filter(self):
        """Test content-based filtering component"""
        print("Testing content-based filter...")
        content_filter = ContentBasedFilter(self.products_df)
        
        # Test similar product recommendations
        test_product_id = 0
        similar_products = content_filter.recommend_similar_products(test_product_id, top_k=5)
        
        print(f"Similar products to product {test_product_id}: {similar_products}")
        self.assertIsInstance(similar_products, list)
        self.assertLessEqual(len(similar_products), 5)
        
        # Test category-urgency recommendations
        preferred_categories = ['Skincare', 'Health']
        urgent_items = content_filter.recommend_by_category_urgency(preferred_categories, top_k=5)
        
        print(f"Urgent items from {preferred_categories}: {urgent_items}")
        self.assertIsInstance(urgent_items, list)
        
        print("✅ Content-based filter test passed")
    
    def test_hybrid_system(self):
        """Test hybrid recommendation system"""
        print("Testing hybrid system...")
        hybrid_system = HybridRecommendationSystem(self.products_df, self.interactions_df)
        
        test_user = "staff_1"
        
        # Test hybrid recommendations
        hybrid_recs = hybrid_system.recommend_hybrid(test_user, top_k=5)
        print(f"Hybrid recommendations shape: {hybrid_recs.shape}")
        self.assertIsInstance(hybrid_recs, pd.DataFrame)
        
        # Test user preferences
        preferences = hybrid_system.get_user_preferences(test_user)
        print(f"User preferences: {preferences}")
        self.assertIsInstance(preferences, list)
        
        print("✅ Hybrid system test passed")
    
    def test_evaluation_system(self):
        """Test evaluation system"""
        print("Testing evaluation system...")
        hybrid_system = HybridRecommendationSystem(self.products_df, self.interactions_df)
        evaluator = RecommendationEvaluator(self.products_df, self.interactions_df, hybrid_system)
        
        # Test data splitting
        train_data, test_data = evaluator.split_data()
        self.assertGreater(len(train_data), 0)
        self.assertGreater(len(test_data), 0)
        
        # Test evaluation metrics
        results = evaluator.evaluate_system(k=3)
        self.assertIn('avg_precision', results)
        self.assertIn('avg_recall', results)
        self.assertIn('avg_f1', results)
        
        print(f"Evaluation results: {results}")
        print("✅ Evaluation system test passed")

if __name__ == '__main__':
    print("=" * 50)
    print("WALMART CLEARANCE OPTIMIZER - UNIT TESTS")
    print("=" * 50)
    unittest.main(verbosity=2)
