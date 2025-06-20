from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

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
        
        # Normalize features for better similarity computation[2]
        self.scaler = StandardScaler()
        self.feature_matrix_scaled = self.scaler.fit_transform(self.feature_matrix)
        
        # Compute content similarity matrix
        self.content_similarity = cosine_similarity(self.feature_matrix_scaled)
    
    def recommend_similar_products(self, product_id, top_k=5):
        """Recommend products similar to given product based on content[2]"""
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
    
    def recommend_discounted_items(self, preferred_categories, top_k=5):
        """Recommend discounted items from preferred categories"""
        if not preferred_categories:
            filtered_products = self.products_df[
                (self.products_df['discount'] > 0) &
                (self.products_df['stock'] > 0)
            ].copy()
        else:
            filtered_products = self.products_df[
                (self.products_df['category'].isin(preferred_categories)) &
                (self.products_df['discount'] > 0) &
                (self.products_df['stock'] > 0)
            ].copy()
        
        if filtered_products.empty:
            return []
        
        top_discounted = filtered_products.nlargest(top_k, 'discount')
        return top_discounted['productId'].values.tolist()
