# recommendation_system.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import csr_matrix
from sklearn.metrics import precision_score, recall_score, f1_score
import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import warnings
warnings.filterwarnings('ignore')

# MongoDB connection setup
def connect_mongodb():
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["walmart_clearance"]
    return db

# Generate sample data for testing
def generate_sample_data():
    np.random.seed(42)
    
    # Product categories and names
    categories = {
        'Skincare': ['Face Cream', 'Moisturizer', 'Sunscreen', 'Anti-aging Serum', 'Cleanser'],
        'Health': ['Vitamin C', 'Pain Relief', 'Multivitamin', 'Protein Powder', 'First Aid'],
        'Haircare': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Mask', 'Styling Gel'],
        'Oral Care': ['Toothpaste', 'Mouthwash', 'Dental Floss', 'Whitening Strips', 'Toothbrush'],
        'Personal Care': ['Hand Sanitizer', 'Body Wash', 'Deodorant', 'Lotion', 'Soap']
    }
    
    products = []
    product_id = 0
    
    for category, items in categories.items():
        for item in items:
            for variant in range(4):  # Create 4 variants of each product
                price = round(np.random.uniform(5, 50), 2)
                expiry_date = datetime.now() + timedelta(days=np.random.randint(1, 180))
                stock = np.random.randint(0, 100)
                days_to_expiry = (expiry_date - datetime.now()).days
                urgency_score = max(0, (30 - days_to_expiry) / 30)
                
                # Create discount for items expiring soon
                discount = 0
                if days_to_expiry <= 7:
                    discount = 0.3
                elif days_to_expiry <= 14:
                    discount = 0.2
                elif days_to_expiry <= 30:
                    discount = 0.1
                
                discounted_price = price * (1 - discount)
                
                products.append({
                    'productId': product_id,
                    'name': f"{item} {variant + 1}",
                    'category': category,
                    'price': price,
                    'discounted_price': discounted_price,
                    'discount': discount,
                    'expiryDate': expiry_date,
                    'stock': stock,
                    'days_to_expiry': days_to_expiry,
                    'urgency_score': urgency_score
                })
                product_id += 1
    
    # Generate user interactions
    user_ids = [f'staff_{i}' for i in range(25)]
    actions = ['viewed', 'added', 'skipped', 'bought']
    action_weights = {'viewed': 0.4, 'added': 0.3, 'skipped': 0.1, 'bought': 0.2}
    
    interactions = []
    for _ in range(1000):
        user = np.random.choice(user_ids)
        product = np.random.choice(range(len(products)))
        action = np.random.choice(actions, p=list(action_weights.values()))
        timestamp = datetime.now() - timedelta(days=np.random.randint(0, 60))
        
        interactions.append({
            'userId': user,
            'productId': product,
            'actionType': action,
            'timestamp': timestamp
        })
    
    return pd.DataFrame(products), pd.DataFrame(interactions)

class CollaborativeFilter:
    def __init__(self, interactions_df):
        self.interactions_df = interactions_df.copy()
        self.user_encoder = LabelEncoder()
        self.product_encoder = LabelEncoder()
        self.setup_matrices()
    
    def setup_matrices(self):
        # Weight different actions differently
        action_weights = {'viewed': 1, 'added': 2, 'skipped': -0.5, 'bought': 3}
        self.interactions_df['weight'] = self.interactions_df['actionType'].map(action_weights)
        
        # Encode users and products
        self.interactions_df['user_idx'] = self.user_encoder.fit_transform(self.interactions_df['userId'])
        self.interactions_df['product_idx'] = self.product_encoder.fit_transform(self.interactions_df['productId'])
        
        # Create user-item interaction matrix
        self.interaction_matrix = csr_matrix(
            (self.interactions_df['weight'], 
             (self.interactions_df['user_idx'], self.interactions_df['product_idx'])),
            shape=(len(self.user_encoder.classes_), len(self.product_encoder.classes_))
        )
        
        # Compute similarity matrices using cosine similarity
        self.item_similarity = cosine_similarity(self.interaction_matrix.T)
        self.user_similarity = cosine_similarity(self.interaction_matrix)
    
    def recommend_item_based(self, user_id, top_k=5):
        """Item-based collaborative filtering recommendations"""
        if user_id not in self.user_encoder.classes_:
            return []
        
        user_idx = self.user_encoder.transform([user_id])[0]
        user_interactions = self.interaction_matrix[user_idx].toarray().flatten()
        
        # Calculate recommendation scores based on item similarity
        scores = self.item_similarity.dot(user_interactions)
        scores[user_interactions > 0] = 0  # Remove already interacted items
        
        # Get top recommendations
        recommended_indices = np.argsort(scores)[::-1][:top_k]
        recommended_product_ids = self.product_encoder.inverse_transform(recommended_indices)
        
        return recommended_product_ids.tolist()
    
    def recommend_user_based(self, user_id, top_k=5):
        """User-based collaborative filtering recommendations"""
        if user_id not in self.user_encoder.classes_:
            return []
        
        user_idx = self.user_encoder.transform([user_id])[0]
        user_similarities = self.user_similarity[user_idx]
        
        # Find similar users (excluding self)
        similar_users = np.argsort(user_similarities)[::-1][1:6]
        
        # Get items liked by similar users
        recommended_items = set()
        user_interactions = self.interaction_matrix[user_idx].toarray().flatten()
        
        for similar_user in similar_users:
            similar_user_items = self.interaction_matrix[similar_user].toarray().flatten()
            # Items liked by similar user but not by current user
            new_items = np.where((similar_user_items > 0) & (user_interactions == 0))[0]
            recommended_items.update(new_items[:top_k])
        
        if recommended_items:
            recommended_product_ids = self.product_encoder.inverse_transform(list(recommended_items)[:top_k])
            return recommended_product_ids.tolist()
        return []
    
    def get_user_category_preferences(self, user_id, products_df):
        """Extract user's preferred categories from interaction history"""
        if user_id not in self.user_encoder.classes_:
            return []
        
        user_interactions = self.interactions_df[
            (self.interactions_df['userId'] == user_id) & 
            (self.interactions_df['actionType'].isin(['added', 'bought']))
        ]
        
        if user_interactions.empty:
            return []
        
        preferred_products = user_interactions['productId'].unique()
        preferred_categories = products_df[
            products_df['productId'].isin(preferred_products)
        ]['category'].value_counts()
        
        return preferred_categories.index.tolist()

class ContentBasedFilter:
    def __init__(self, products_df):
        self.products_df = products_df.copy()
        self.setup_features()
    
    def setup_features(self):
        # Encode categorical features
        self.category_encoder = LabelEncoder()
        self.products_df['category_encoded'] = self.category_encoder.fit_transform(self.products_df['category'])
        
        # Create feature matrix with normalized values
        features = ['category_encoded', 'price', 'days_to_expiry', 'stock', 'urgency_score', 'discount']
        self.feature_matrix = self.products_df[features].values
        
        # Normalize features for better similarity computation
        self.scaler = StandardScaler()
        self.feature_matrix_scaled = self.scaler.fit_transform(self.feature_matrix)
        
        # Compute content similarity matrix
        self.content_similarity = cosine_similarity(self.feature_matrix_scaled)
    
    def recommend_similar_products(self, product_id, top_k=5):
        """Recommend products similar to given product based on content"""
        if product_id not in self.products_df['productId'].values:
            return []
        
        idx = self.products_df.index[self.products_df['productId'] == product_id].tolist()[0]
        sim_scores = self.content_similarity[idx]
        sim_scores[idx] = 0  # Exclude self
        
        recommended_indices = np.argsort(sim_scores)[::-1][:top_k]
        return self.products_df.iloc[recommended_indices]['productId'].values.tolist()
    
    def recommend_by_category_urgency(self, preferred_categories, top_k=5, urgency_threshold=14):
        """Recommend urgent items from preferred categories"""
        if not preferred_categories:
            # If no preferences, recommend most urgent items
            filtered_products = self.products_df[
                (self.products_df['days_to_expiry'] <= urgency_threshold) &
                (self.products_df['stock'] > 0)
            ].copy()
        else:
            filtered_products = self.products_df[
                (self.products_df['category'].isin(preferred_categories)) &
                (self.products_df['days_to_expiry'] <= urgency_threshold) &
                (self.products_df['stock'] > 0)
            ].copy()
        
        if filtered_products.empty:
            return []
        
        # Calculate combined score: urgency + discount + stock availability
        filtered_products['combined_score'] = (
            filtered_products['urgency_score'] * 0.5 + 
            filtered_products['discount'] * 0.3 +
            (filtered_products['stock'] > 10).astype(int) * 0.2
        )
        
        top_urgent = filtered_products.nlargest(top_k, 'combined_score')
        return top_urgent['productId'].values.tolist()

class HybridRecommendationSystem:
    def __init__(self, products_df, interactions_df):
        self.products_df = products_df
        self.interactions_df = interactions_df
        self.collaborative_filter = CollaborativeFilter(interactions_df)
        self.content_filter = ContentBasedFilter(products_df)
    
    def get_user_preferences(self, user_id):
        """Extract user preferences from interaction history"""
        return self.collaborative_filter.get_user_category_preferences(user_id, self.products_df)
    
    def recommend_hybrid(self, user_id, top_k=10, weights={'collab': 0.4, 'content': 0.3, 'urgency': 0.3}):
        """Hybrid recommendation combining all approaches"""
        recommendations = {}
        
        # 1. Collaborative filtering recommendations
        try:
            item_based_recs = self.collaborative_filter.recommend_item_based(user_id, top_k)
            user_based_recs = self.collaborative_filter.recommend_user_based(user_id, top_k)
            
            # Combine item-based and user-based collaborative filtering
            collab_recs = list(set(item_based_recs + user_based_recs))
            
            for item in collab_recs:
                recommendations[item] = recommendations.get(item, 0) + weights['collab']
        except:
            collab_recs = []
        
        # 2. Content-based recommendations
        user_prefs = self.get_user_preferences(user_id)
        if user_prefs:
            urgent_items = self.content_filter.recommend_by_category_urgency(user_prefs, top_k)
            for item in urgent_items:
                recommendations[item] = recommendations.get(item, 0) + weights['content']
        
        # 3. Urgency-based recommendations (expiring soon)
        urgent_items = self.content_filter.recommend_by_category_urgency(
            user_prefs, top_k, urgency_threshold=14
        )
        for item in urgent_items:
            recommendations[item] = recommendations.get(item, 0) + weights['urgency']
        
        # Sort by combined score and return top-k
        if not recommendations:
            # Fallback: recommend most urgent items overall
            fallback_items = self.content_filter.recommend_by_category_urgency([], top_k)
            recommendations = {item: 1.0 for item in fallback_items}
        
        sorted_recommendations = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        top_recommendation_ids = [item[0] for item in sorted_recommendations[:top_k]]
        
        # Return detailed product information
        result_df = self.products_df[self.products_df['productId'].isin(top_recommendation_ids)].copy()
        result_df['recommendation_score'] = result_df['productId'].map(dict(sorted_recommendations))
        return result_df.sort_values('recommendation_score', ascending=False)

class RecommendationEvaluator:
    def __init__(self, products_df, interactions_df, recommendation_system):
        self.products_df = products_df
        self.interactions_df = interactions_df
        self.rec_system = recommendation_system
    
    def split_data(self, test_ratio=0.2):
        """Split interactions into train and test sets"""
        test_interactions = self.interactions_df.sample(frac=test_ratio, random_state=42)
        train_interactions = self.interactions_df.drop(test_interactions.index)
        return train_interactions, test_interactions
    
    def precision_at_k(self, recommendations, ground_truth, k=5):
        """Calculate Precision@K"""
        if len(recommendations) == 0:
            return 0
        
        top_k_recs = recommendations[:k]
        relevant_items = set(ground_truth)
        recommended_items = set(top_k_recs)
        
        intersection = len(relevant_items.intersection(recommended_items))
        return intersection / len(recommended_items) if len(recommended_items) > 0 else 0
    
    def recall_at_k(self, recommendations, ground_truth, k=5):
        """Calculate Recall@K"""
        if len(ground_truth) == 0:
            return 0
        
        top_k_recs = recommendations[:k]
        relevant_items = set(ground_truth)
        recommended_items = set(top_k_recs)
        
        intersection = len(relevant_items.intersection(recommended_items))
        return intersection / len(relevant_items)
    
    def f1_score_at_k(self, precision, recall):
        """Calculate F1-Score"""
        if precision + recall == 0:
            return 0
        return 2 * (precision * recall) / (precision + recall)
    
    def evaluate_system(self, k=5):
        """Comprehensive evaluation of the recommendation system"""
        train_data, test_data = self.split_data()
        
        # Rebuild system with train data only
        train_rec_system = HybridRecommendationSystem(self.products_df, train_data)
        
        results = []
        
        for user_id in train_data['userId'].unique()[:10]:  # Evaluate on subset for speed
            # Get ground truth from test data
            user_test_interactions = test_data[
                (test_data['userId'] == user_id) & 
                (test_data['actionType'].isin(['added', 'bought']))
            ]
            ground_truth = user_test_interactions['productId'].tolist()
            
            if len(ground_truth) == 0:
                continue
            
            # Get recommendations
            try:
                recs_df = train_rec_system.recommend_hybrid(user_id, top_k=k)
                recommendations = recs_df['productId'].tolist() if not recs_df.empty else []
                
                # Calculate metrics
                precision = self.precision_at_k(recommendations, ground_truth, k)
                recall = self.recall_at_k(recommendations, ground_truth, k)
                f1 = self.f1_score_at_k(precision, recall)
                
                results.append({
                    'user_id': user_id,
                    'precision': precision,
                    'recall': recall,
                    'f1': f1
                })
            except Exception as e:
                print(f"Error evaluating user {user_id}: {e}")
                continue
        
        if not results:
            return {
                'avg_precision': 0,
                'avg_recall': 0,
                'avg_f1': 0,
                'coverage': 0,
                'num_users_evaluated': 0
            }
        
        # Calculate average metrics
        avg_precision = np.mean([r['precision'] for r in results])
        avg_recall = np.mean([r['recall'] for r in results])
        avg_f1 = np.mean([r['f1'] for r in results])
        
        return {
            'avg_precision': avg_precision,
            'avg_recall': avg_recall,
            'avg_f1': avg_f1,
            'coverage': 0.8,  # Placeholder
            'num_users_evaluated': len(results)
        }

# Initialize sample data when module is imported
if __name__ == "__main__":
    products_df, interactions_df = generate_sample_data()
    print(f"Generated {len(products_df)} products and {len(interactions_df)} interactions")
