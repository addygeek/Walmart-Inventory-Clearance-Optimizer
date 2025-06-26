from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv(MONGODB_URI)
class MongoDBHandler:
    def __init__(self, db_name="walmart_clearance"):
        self.client = pymongo.MongoClient(MONGODB_URI)
        self.db = self.client[db_name]
        self.products_collection = self.db["products"]
        self.interactions_collection = self.db["interactions"]
        self.recommendations_collection = self.db["recommendations"]
    
    def save_products(self, products_df):
        """Save products to MongoDB"""
        products_dict = products_df.to_dict('records')
        for product in products_dict:
            product['expiryDate'] = product['expiryDate'].isoformat()
        
        self.products_collection.delete_many({})
        self.products_collection.insert_many(products_dict)
        print(f"Saved {len(products_dict)} products to MongoDB")
    
    def save_interactions(self, interactions_df):
        """Save interactions to MongoDB"""
        interactions_dict = interactions_df.to_dict('records')
        for interaction in interactions_dict:
            interaction['timestamp'] = interaction['timestamp'].isoformat()
        
        self.interactions_collection.delete_many({})
        self.interactions_collection.insert_many(interactions_dict)
        print(f"Saved {len(interactions_dict)} interactions to MongoDB")
    
    def load_products(self):
        """Load products from MongoDB"""
        products = list(self.products_collection.find({}, {'_id': 0}))
        if not products:
            return pd.DataFrame()
        
        df = pd.DataFrame(products)
        df['expiryDate'] = pd.to_datetime(df['expiryDate'])
        return df
    
    def load_interactions(self):
        """Load interactions from MongoDB"""
        interactions = list(self.interactions_collection.find({}, {'_id': 0}))
        if not interactions:
            return pd.DataFrame()
        
        df = pd.DataFrame(interactions)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    
    def add_interaction(self, user_id, product_id, action_type):
        """Add new interaction"""
        interaction = {
            'userId': user_id,
            'productId': product_id,
            'actionType': action_type,
            'timestamp': datetime.now().isoformat()
        }
        self.interactions_collection.insert_one(interaction)
        return True
    
    def cache_recommendations(self, user_id, recommendations, rec_type='hybrid'):
        """Cache recommendations for faster retrieval"""
        cache_doc = {
            'userId': user_id,
            'recommendations': recommendations,
            'type': rec_type,
            'timestamp': datetime.now().isoformat(),
            'expires_at': (datetime.now() + timedelta(hours=1)).isoformat()
        }
        
        # Update or insert
        self.recommendations_collection.replace_one(
            {'userId': user_id, 'type': rec_type},
            cache_doc,
            upsert=True
        )
