# Example usage and testing
if __name__ == "__main__":
    # Initialize MongoDB handler
    mongo_handler = MongoDBHandler()
    
    # Generate and save sample data
    products_df, interactions_df = generate_sample_data()
    mongo_handler.save_products(products_df)
    mongo_handler.save_interactions(interactions_df)
    
    # Create recommendation system
    rec_system = HybridRecommendationSystem(products_df, interactions_df)
    
    # Test recommendations for a staff member
    test_user = "staff_1"
    print(f"\n=== Testing Recommendations for {test_user} ===")
    
    # Get user preferences
    preferences = rec_system.get_user_preferences(test_user)
    print(f"User preferences: {preferences}")
    
    # Hybrid recommendations
    print("\n--- Hybrid Recommendations ---")
    hybrid_recs = rec_system.recommend_hybrid(test_user, top_k=5)
    if not hybrid_recs.empty:
        print(hybrid_recs[['name', 'category', 'price', 'discounted_price', 'days_to_expiry', 'recommendation_score']].to_string())
    else:
        print("No hybrid recommendations found")
    
    # Clearance recommendations
    print("\n--- Clearance Priority Recommendations ---")
    clearance_recs = rec_system.recommend_clearance_priority(test_user, top_k=5)
    if not clearance_recs.empty:
        print(clearance_recs[['name', 'category', 'price', 'discount', 'days_to_expiry', 'priority_score']].to_string())
    else:
        print("No clearance recommendations found")
    
    # Evaluate system performance
    print(f"\n=== System Evaluation ===")
    evaluator = RecommendationEvaluator(products_df, interactions_df, rec_system)
    evaluation_results = evaluator.evaluate_system(k=5)
    
    print(f"Average Precision@5: {evaluation_results['avg_precision']:.3f}")
    print(f"Average Recall@5: {evaluation_results['avg_recall']:.3f}")
    print(f"Average F1@5: {evaluation_results['avg_f1']:.3f}")
    print(f"Average Novelty: {evaluation_results['avg_novelty']:.3f}")
    print(f"Coverage: {evaluation_results['coverage']:.3f}")
    print(f"Users Evaluated: {evaluation_results['num_users_evaluated']}")
    
    # Test adding new interaction
    print(f"\n=== Testing New Interaction ===")
    mongo_handler.add_interaction(test_user, 5, 'bought')
    print("Added new interaction: staff_1 bought product 5")
    
    print("\nRecommendation system ready! Run the Flask app to start the API server.")
