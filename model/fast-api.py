app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend
from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
# Initialize the system
mongo_handler = MongoDBHandler()

# Load data from MongoDB or use sample data
products_df = mongo_handler.load_products()
interactions_df = mongo_handler.load_interactions()

if products_df.empty or interactions_df.empty:
    print("No data found in MongoDB, generating sample data...")
    products_df, interactions_df = generate_sample_data()
    mongo_handler.save_products(products_df)
    mongo_handler.save_interactions(interactions_df)

# Initialize recommendation system
rec_system = HybridRecommendationSystem(products_df, interactions_df)

@app.route('/api/recommendations/<user_id>')
def get_recommendations(user_id):
    """Get hybrid recommendations for a user[6][7][8]"""
    try:
        top_k = request.args.get('top_k', 10, type=int)
        rec_type = request.args.get('type', 'hybrid')
        
        if rec_type == 'hybrid':
            recs_df = rec_system.recommend_hybrid(user_id, top_k=top_k)
        elif rec_type == 'clearance':
            urgency_threshold = request.args.get('urgency_threshold', 7, type=int)
            recs_df = rec_system.recommend_clearance_priority(
                user_id, urgency_threshold=urgency_threshold, top_k=top_k
            )
        else:
            return jsonify({'error': 'Invalid recommendation type'}), 400
        
        # Convert to JSON-serializable format
        recommendations = []
        for _, row in recs_df.iterrows():
            rec_data = {
                'productId': int(row['productId']),
                'name': row['name'],
                'category': row['category'],
                'price': float(row['price']),
                'discounted_price': float(row['discounted_price']),
                'discount': float(row['discount']),
                'stock': int(row['stock']),
                'days_to_expiry': int(row['days_to_expiry']),
                'urgency_score': float(row['urgency_score']),
                'expiryDate': row['expiryDate'].isoformat()
            }
            
            if 'recommendation_score' in row:
                rec_data['recommendation_score'] = float(row['recommendation_score'])
            if 'priority_score' in row:
                rec_data['priority_score'] = float(row['priority_score'])
            
            recommendations.append(rec_data)
        
        # Cache recommendations
        mongo_handler.cache_recommendations(user_id, recommendations, rec_type)
        
        return jsonify({
            'user_id': user_id,
            'type': rec_type,
            'recommendations': recommendations,
            'count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user-preferences/<user_id>')
def get_user_preferences(user_id):
    """Get user's category preferences"""
    try:
        preferences = rec_system.get_user_preferences(user_id)
        return jsonify({
            'user_id': user_id,
            'preferred_categories': preferences
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/interaction', methods=['POST'])
def add_interaction():
    """Add new user interaction[6][7][8]"""
    try:
        data = request.json
        user_id = data['userId']
        product_id = data['productId']
        action_type = data['actionType']
        
        # Validate action type
        if action_type not in ['viewed', 'added', 'skipped', 'bought']:
            return jsonify({'error': 'Invalid action type'}), 400
        
        # Add to MongoDB
        mongo_handler.add_interaction(user_id, product_id, action_type)
        
        # Update in-memory data
        global interactions_df, rec_system
        new_interaction = pd.DataFrame([{
            'userId': user_id,
            'productId': product_id,
            'actionType': action_type,
            'timestamp': datetime.now()
        }])
        interactions_df = pd.concat([interactions_df, new_interaction], ignore_index=True)
        
        # Reinitialize recommendation system periodically (every 10 interactions)
        if len(interactions_df) % 10 == 0:
            rec_system = HybridRecommendationSystem(products_df, interactions_df)
        
        return jsonify({
            'status': 'success',
            'message': 'Interaction recorded successfully',
            'interaction': {
                'userId': user_id,
                'productId': product_id,
                'actionType': action_type,
                'timestamp': datetime.now().isoformat()
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluate')
def evaluate_system():
    """Evaluate recommendation system performance[5]"""
    try:
        k = request.args.get('k', 5, type=int)
        evaluator = RecommendationEvaluator(products_df, interactions_df, rec_system)
        results = evaluator.evaluate_system(k=k)
        
        return jsonify({
            'evaluation_results': results,
            'k': k,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/expiring')
def get_expiring_products():
    """Get products expiring within specified days"""
    try:
        days = request.args.get('days', 7, type=int)
        category = request.args.get('category', None)
        
        expiring_products = products_df[
            (products_df['days_to_expiry'] <= days) &
            (products_df['stock'] > 0)
        ].copy()
        
        if category:
            expiring_products = expiring_products[expiring_products['category'] == category]
        
        expiring_products = expiring_products.sort_values('days_to_expiry')
        
        products_list = []
        for _, row in expiring_products.iterrows():
            products_list.append({
                'productId': int(row['productId']),
                'name': row['name'],
                'category': row['category'],
                'price': float(row['price']),
                'discounted_price': float(row['discounted_price']),
                'discount': float(row['discount']),
                'stock': int(row['stock']),
                'days_to_expiry': int(row['days_to_expiry']),
                'urgency_score': float(row['urgency_score']),
                'expiryDate': row['expiryDate'].isoformat()
            })
        
        return jsonify({
            'expiring_products': products_list,
            'days_threshold': days,
            'category_filter': category,
            'count': len(products_list)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
