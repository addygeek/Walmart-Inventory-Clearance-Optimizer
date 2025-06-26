# init_db.py
import pymongo
from datetime import datetime, timedelta
import random
import os
from dotenv import load_dotenv
MONGODB_URI = os.getenv("MONGODB_URI")
# MongoDB connection
MONGO_URI = MONGODB_URI
client = pymongo.MongoClient(MONGODB_URI)
db = client['walmart_clearance']

def init_database():
    """Initialize database with sample data"""
    db.products.delete_many({})

    # Create indexes
    db.products.create_index([('productId', 1)], unique=True)
    db.products.create_index([('category', 1)])
    db.products.create_index([('days_to_expiry', 1)])
    db.products.create_index([('urgency_score', -1)])
    db.products.create_index([('status', 1)])
    
    db.interactions.create_index([('userId', 1)])
    db.interactions.create_index([('productId', 1)])
    db.interactions.create_index([('timestamp', -1)])
    
    db.users.create_index([('email', 1)], unique=True)
    
    print("✅ Database indexes created successfully!")
    
    # Sample data
    categories = ['Skincare', 'Health', 'Haircare', 'Oral Care', 'Personal Care', 'Vitamins', 'Baby Care']
    
    sample_products = []
    for i in range(100):
        days_to_expiry = random.randint(1, 180)
        expiry_date = datetime.now() + timedelta(days=days_to_expiry)
        price = round(random.uniform(5, 100), 2)
        
        # Calculate discount based on expiry
        if days_to_expiry <= 3:
            discount = 0.4
        elif days_to_expiry <= 7:
            discount = 0.3
        elif days_to_expiry <= 14:
            discount = 0.2
        elif days_to_expiry <= 30:
            discount = 0.1
        else:
            discount = 0
        
        urgency_score = max(0, (30 - days_to_expiry) / 30)
        
        product = {
            'productId': f'PROD_{i+1:04d}',
            'name': f'Product {i+1}',
            'category': random.choice(categories),
            'price': price,
            'discounted_price': price * (1 - discount),
            'discount': discount,
            'expiryDate': expiry_date,
            'stock': random.randint(0, 100),
            'days_to_expiry': days_to_expiry,
            'urgency_score': urgency_score,
            'description': f'High-quality {random.choice(categories).lower()} product',
            'sku': f'SKU{i+1:06d}',
            'supplier': f'Supplier {random.randint(1, 10)}',
            'location': f'Aisle {random.randint(1, 20)}',
            'created_at': datetime.now(),
            'status': 'active'
        }
        sample_products.append(product)
    
    # Insert sample products
    try:
        db.products.insert_many(sample_products)
        print(f"✅ Inserted {len(sample_products)} sample products!")
    except Exception as e:
        print(f"❌ Error inserting products: {e}")

if __name__ == '__main__':
    init_database()
