# init_db_fixed.py
import pymongo
from datetime import datetime, timedelta
import random
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv


# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

def get_mongo_connection():
    """Get MongoDB connection with proper error handling"""
    
    # Replace these with your actual MongoDB Atlas credentials
    username = "your_username"  # Replace with your Atlas username
    password = "your_password"  # Replace with your Atlas password
    cluster_url = "cluster0.xxxxx.mongodb.net"  # Replace with your cluster URL
    
    # URL encode the username and password to handle special characters
    username = quote_plus(username)
    password = quote_plus(password)
    
    # Construct the connection string
    #MONGO_URI = f"mongodb+srv://{username}:{password}@{cluster_url}/walmart_clearance?retryWrites=true&w=majority&appName=WalmartClearanceApp"
    MONGO_URI= MONGODB_URI
    try:
        # Create client with additional options for Atlas
        client = pymongo.MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=30000,  # 30 second timeout
            connectTimeoutMS=20000,          # 20 second connection timeout
            maxPoolSize=50,                  # Maximum connection pool size
            retryWrites=True
        )
        
        # Test the connection
        client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        return client
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB Atlas: {e}")
        return None

def init_database():
    """Initialize database with sample data"""
    
    # Get MongoDB connection
    client = get_mongo_connection()
    if not client:
        return
    
    try:
        # Select database and collections
        db = client['walmart_clearance']
        products_collection = db['products']
        interactions_collection = db['interactions']
        users_collection = db['users']
        
        print("🗄️ Setting up database collections...")
        
        # Clear existing data (optional - remove if you want to keep existing data)
        print("🧹 Clearing existing data...")
        products_collection.delete_many({})
        interactions_collection.delete_many({})
        
        # Create indexes for better performance
        print("📊 Creating database indexes...")
        
        try:
            products_collection.create_index([('productId', 1)], unique=True)
            products_collection.create_index([('category', 1)])
            products_collection.create_index([('days_to_expiry', 1)])
            products_collection.create_index([('urgency_score', -1)])
            products_collection.create_index([('status', 1)])
            
            interactions_collection.create_index([('userId', 1)])
            interactions_collection.create_index([('productId', 1)])
            interactions_collection.create_index([('timestamp', -1)])
            
            users_collection.create_index([('email', 1)], unique=True)
            
            print("✅ Database indexes created successfully!")
        except Exception as e:
            print(f"⚠️ Index creation warning (may already exist): {e}")
        
        # Generate sample products
        print("🏪 Generating sample products...")
        
        categories = [
            'Skincare', 'Health', 'Haircare', 'Oral Care', 
            'Personal Care', 'Vitamins', 'Baby Care', 'Beauty',
            'Supplements', 'First Aid'
        ]
        
        product_names = {
            'Skincare': ['Face Cream', 'Moisturizer', 'Sunscreen', 'Anti-aging Serum', 'Cleanser', 'Toner'],
            'Health': ['Vitamin C', 'Pain Relief', 'Multivitamin', 'Protein Powder', 'First Aid Kit', 'Thermometer'],
            'Haircare': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Mask', 'Styling Gel', 'Hair Spray'],
            'Oral Care': ['Toothpaste', 'Mouthwash', 'Dental Floss', 'Whitening Strips', 'Toothbrush', 'Tongue Cleaner'],
            'Personal Care': ['Hand Sanitizer', 'Body Wash', 'Deodorant', 'Lotion', 'Soap', 'Body Spray'],
            'Vitamins': ['Vitamin D', 'Calcium', 'Iron', 'B-Complex', 'Omega-3', 'Zinc'],
            'Baby Care': ['Baby Lotion', 'Baby Shampoo', 'Diapers', 'Baby Oil', 'Baby Powder', 'Wet Wipes'],
            'Beauty': ['Lipstick', 'Foundation', 'Mascara', 'Nail Polish', 'Perfume', 'Compact'],
            'Supplements': ['Protein Bar', 'Energy Drink', 'Creatine', 'BCAA', 'Pre-workout', 'Recovery Drink'],
            'First Aid': ['Bandages', 'Antiseptic', 'Pain Killer', 'Cough Syrup', 'Fever Reducer', 'Allergy Medicine']
        }
        
        sample_products = []
        
        for i in range(100):
            category = random.choice(categories)
            product_name = random.choice(product_names[category])
            
            days_to_expiry = random.randint(1, 180)
            expiry_date = datetime.utcnow() + timedelta(days=days_to_expiry)
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
                'name': f'{product_name} {random.choice(["Premium", "Classic", "Advanced", "Pro", "Ultra"])}',
                'category': category,
                'price': price,
                'discounted_price': round(price * (1 - discount), 2),
                'discount': discount,
                'expiryDate': expiry_date,
                'stock': random.randint(0, 100),
                'days_to_expiry': days_to_expiry,
                'urgency_score': urgency_score,
                'description': f'High-quality {category.lower()} product for daily use',
                'sku': f'SKU{i+1:06d}',
                'supplier': f'Supplier {random.randint(1, 10)}',
                'location': f'Aisle {random.randint(1, 20)}-{random.randint(1, 10)}',
                'created_at': datetime.utcnow(),
                'status': 'active'
            }
            sample_products.append(product)
        
        # Insert products in batches to avoid timeout
        print("📦 Inserting products into database...")
        batch_size = 20
        inserted_count = 0
        
        for i in range(0, len(sample_products), batch_size):
            batch = sample_products[i:i + batch_size]
            try:
                result = products_collection.insert_many(batch)
                inserted_count += len(result.inserted_ids)
                print(f"✅ Inserted batch {i//batch_size + 1}: {len(result.inserted_ids)} products")
            except Exception as e:
                print(f"❌ Error inserting batch {i//batch_size + 1}: {e}")
        
        print(f"🎉 Successfully inserted {inserted_count} products!")
        
        # Generate sample interactions
        print("👥 Generating sample user interactions...")
        
        user_ids = [f'staff_{i}' for i in range(1, 21)]
        actions = ['viewed', 'added', 'skipped', 'bought', 'favorited']
        action_weights = [0.4, 0.25, 0.1, 0.15, 0.1]
        
        sample_interactions = []
        
        for _ in range(200):
            interaction = {
                'userId': random.choice(user_ids),
                'productId': f'PROD_{random.randint(1, 100):04d}',
                'actionType': random.choices(actions, weights=action_weights)[0],
                'timestamp': datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                'session_id': f'session_{random.randint(1000, 9999)}',
                'metadata': {
                    'source': 'web_app',
                    'device': random.choice(['desktop', 'mobile', 'tablet'])
                }
            }
            sample_interactions.append(interaction)
        
        # Insert interactions
        try:
            result = interactions_collection.insert_many(sample_interactions)
            print(f"✅ Inserted {len(result.inserted_ids)} user interactions!")
        except Exception as e:
            print(f"❌ Error inserting interactions: {e}")
        
        # Create sample users
        print("👤 Creating sample users...")
        
        sample_users = [
            {
                'username': 'admin',
                'email': 'admin@walmart.com',
                'role': 'admin',
                'created_at': datetime.utcnow(),
                'preferences': {
                    'categories': ['Health', 'Skincare'],
                    'notification_settings': {'email': True, 'push': True}
                }
            },
            {
                'username': 'manager1',
                'email': 'manager1@walmart.com',
                'role': 'manager',
                'created_at': datetime.utcnow(),
                'preferences': {
                    'categories': ['Personal Care', 'Beauty'],
                    'notification_settings': {'email': True, 'push': False}
                }
            },
            {
                'username': 'staff1',
                'email': 'staff1@walmart.com',
                'role': 'staff',
                'created_at': datetime.utcnow(),
                'preferences': {
                    'categories': ['Vitamins', 'Supplements'],
                    'notification_settings': {'email': False, 'push': True}
                }
            }
        ]
        
        try:
            result = users_collection.insert_many(sample_users)
            print(f"✅ Created {len(result.inserted_ids)} sample users!")
        except Exception as e:
            print(f"❌ Error creating users: {e}")
        
        # Verify data insertion
        print("\n📊 Database Summary:")
        print(f"Products: {products_collection.count_documents({})}")
        print(f"Interactions: {interactions_collection.count_documents({})}")
        print(f"Users: {users_collection.count_documents({})}")
        
        print("\n🎉 Database initialization completed successfully!")
        print("🔗 You can now view your data in MongoDB Atlas Data Explorer")
        
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")
    
    finally:
        if client:
            client.close()

if __name__ == '__main__':
    print("🚀 Starting Walmart Clearance Optimizer Database Initialization")
    print("=" * 60)
    init_database()
