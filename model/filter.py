from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

class CollaborativeFilter:
    def __init__(self, interactions_df):
        self.interactions_df = interactions_df.copy()
        self.user_encoder = LabelEncoder()
        self.product_encoder = LabelEncoder()
        self.setup_matrices()
    
    def setup_matrices(self):
        # Weight different actions differently[1]
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
        
        # Compute similarity matrices using cosine similarity[1]
        self.item_similarity = cosine_similarity(self.interaction_matrix.T)
        self.user_similarity = cosine_similarity(self.interaction_matrix)
    
    def recommend_item_based(self, user_id, top_k=5):
        """Item-based collaborative filtering recommendations[1]"""
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
        """User-based collaborative filtering recommendations[1]"""
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
