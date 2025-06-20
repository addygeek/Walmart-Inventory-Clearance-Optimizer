from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

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
        """Calculate Precision@K[4][5]"""
        if len(recommendations) == 0:
            return 0
        
        top_k_recs = recommendations[:k]
        relevant_items = set(ground_truth)
        recommended_items = set(top_k_recs)
        
        intersection = len(relevant_items.intersection(recommended_items))
        return intersection / len(recommended_items) if len(recommended_items) > 0 else 0
    
    def recall_at_k(self, recommendations, ground_truth, k=5):
        """Calculate Recall@K[4][5]"""
        if len(ground_truth) == 0:
            return 0
        
        top_k_recs = recommendations[:k]
        relevant_items = set(ground_truth)
        recommended_items = set(top_k_recs)
        
        intersection = len(relevant_items.intersection(recommended_items))
        return intersection / len(relevant_items)
    
    def f1_score_at_k(self, precision, recall):
        """Calculate F1-Score[4]"""
        if precision + recall == 0:
            return 0
        return 2 * (precision * recall) / (precision + recall)
    
    def coverage(self, all_recommendations):
        """Calculate catalog coverage"""
        recommended_items = set()
        for recs in all_recommendations:
            recommended_items.update(recs)
        return len(recommended_items) / len(self.products_df)
    
    def novelty(self, recommendations, interactions_df):
        """Calculate novelty - how many recommended items are not popular"""
        item_popularity = interactions_df['productId'].value_counts()
        total_interactions = len(interactions_df)
        
        novelty_scores = []
        for item in recommendations:
            popularity = item_popularity.get(item, 0) / total_interactions
            novelty_scores.append(1 - popularity)  # Higher novelty for less popular items
        
        return np.mean(novelty_scores) if novelty_scores else 0
    
    def evaluate_system(self, k=5):
        """Comprehensive evaluation of the recommendation system[5]"""
        train_data, test_data = self.split_data()
        
        # Rebuild system with train data only
        train_rec_system = HybridRecommendationSystem(self.products_df, train_data)
        
        results = []
        all_recommendations = []
        
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
                all_recommendations.append(recommendations)
                
                # Calculate metrics
                precision = self.precision_at_k(recommendations, ground_truth, k)
                recall = self.recall_at_k(recommendations, ground_truth, k)
                f1 = self.f1_score_at_k(precision, recall)
                novelty = self.novelty(recommendations, train_data)
                
                results.append({
                    'user_id': user_id,
                    'precision': precision,
                    'recall': recall,
                    'f1': f1,
                    'novelty': novelty
                })
            except Exception as e:
                print(f"Error evaluating user {user_id}: {e}")
                continue
        
        if not results:
            return {
                'avg_precision': 0,
                'avg_recall': 0,
                'avg_f1': 0,
                'avg_novelty': 0,
                'coverage': 0,
                'num_users_evaluated': 0
            }
        
        # Calculate average metrics
        avg_precision = np.mean([r['precision'] for r in results])
        avg_recall = np.mean([r['recall'] for r in results])
        avg_f1 = np.mean([r['f1'] for r in results])
        avg_novelty = np.mean([r['novelty'] for r in results])
        coverage_score = self.coverage(all_recommendations)
        
        return {
            'avg_precision': avg_precision,
            'avg_recall': avg_recall,
            'avg_f1': avg_f1,
            'avg_novelty': avg_novelty,
            'coverage': coverage_score,
            'num_users_evaluated': len(results)
        }
