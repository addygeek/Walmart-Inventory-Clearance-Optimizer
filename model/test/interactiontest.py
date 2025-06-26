import os
import sys
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

try:
    import pymongo
    from pymongo import MongoClient
    from bson import ObjectId
    print("✅ PyMongo imported successfully")
except ImportError:
    print("❌ PyMongo not installed. Install with: pip install pymongo")
    sys.exit(1)

def test_mongodb_interactions():
    """Test MongoDB interactions collection operations"""
    
    # Get MongoDB URI from environment variable
    MONGODB_URI = os.getenv("MONGODB_URI")
    
    if not MONGODB_URI:
        print("❌ MONGODB_URI environment variable not set")
        print("Please create a .env file with: MONGODB_URI=your_mongodb_connection_string")
        return False
    
    print(f"🔗 Using MongoDB URI: {MONGODB_URI[:50]}...")
    
    try:
        # Test connection
        print("\n1. Testing MongoDB Connection...")
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection with ping
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Select database and collection
        db = client['walmart_clearance']
        interactions_collection = db['interactions']
        products_collection = db['products']
        
        print(f"📊 Database: {db.name}")
        print(f"📊 Collections available: {db.list_collection_names()}")
        
        # Test 2: Check existing data
        print("\n2. Checking existing data...")
        interactions_count = interactions_collection.count_documents({})
        products_count = products_collection.count_documents({})
        
        print(f"📈 Existing interactions: {interactions_count}")
        print(f"📦 Existing products: {products_count}")
        
        # Test 3: Insert test interaction
        print("\n3. Testing interaction insertion...")
        
        test_interaction = {
            'userId': 'test_user_123',
            'productId': 'PROD_0001',
            'actionType': 'viewed',
            'quantity': None,
            'timestamp': datetime.utcnow(),
            'session_id': 'test_session_456',
            'metadata': {
                'test': True,
                'source': 'python_test'
            },
            'ip_address': '127.0.0.1',
            'user_agent': 'Python Test Script',
            'created_at': datetime.utcnow()
        }
        
        # Insert the test interaction
        result = interactions_collection.insert_one(test_interaction)
        print(f"✅ Test interaction inserted with ID: {result.inserted_id}")
        
        # Test 4: Find the inserted interaction
        print("\n4. Testing interaction retrieval...")
        
        found_interaction = interactions_collection.find_one({'_id': result.inserted_id})
        if found_interaction:
            print("✅ Test interaction found successfully!")
            print(f"   User ID: {found_interaction['userId']}")
            print(f"   Product ID: {found_interaction['productId']}")
            print(f"   Action Type: {found_interaction['actionType']}")
            print(f"   Timestamp: {found_interaction['timestamp']}")
        else:
            print("❌ Test interaction not found!")
            return False
        
        # Test 5: Test different interaction types
        print("\n5. Testing different interaction types...")
        
        interaction_types = ['viewed', 'added', 'skipped', 'favorited', 'shared']
        inserted_ids = []
        
        for action_type in interaction_types:
            test_doc = {
                'userId': f'test_user_{action_type}',
                'productId': f'PROD_{action_type.upper()}',
                'actionType': action_type,
                'quantity': 1 if action_type == 'bought' else None,
                'timestamp': datetime.utcnow(),
                'session_id': 'bulk_test_session',
                'metadata': {'bulk_test': True},
                'created_at': datetime.utcnow()
            }
            
            result = interactions_collection.insert_one(test_doc)
            inserted_ids.append(result.inserted_id)
            print(f"   ✅ {action_type} interaction inserted")
        
        # Test 6: Query interactions
        print("\n6. Testing interaction queries...")
        
        # Find by user ID
        user_interactions = list(interactions_collection.find({'userId': 'test_user_123'}))
        print(f"   📊 Found {len(user_interactions)} interactions for test_user_123")
        
        # Find by action type
        viewed_interactions = list(interactions_collection.find({'actionType': 'viewed'}))
        print(f"   📊 Found {len(viewed_interactions)} 'viewed' interactions")
        
        # Find recent interactions (last hour)
        recent_time = datetime.utcnow() - timedelta(hours=1)
        recent_interactions = list(interactions_collection.find({
            'timestamp': {'$gte': recent_time}
        }))
        print(f"   📊 Found {len(recent_interactions)} recent interactions")
        
        # Test 7: Test stock update simulation (for 'bought' action)
        print("\n7. Testing stock update simulation...")
        
        # First, check if we have any products
        sample_product = products_collection.find_one({'status': 'active'})
        
        if sample_product:
            product_id = sample_product['productId']
            current_stock = sample_product.get('stock', 0)
            
            print(f"   📦 Testing with product: {product_id}")
            print(f"   📦 Current stock: {current_stock}")
            
            if current_stock > 0:
                # Simulate a purchase
                quantity = 1
                
                # Test atomic stock update
                update_result = products_collection.update_one(
                    {
                        'productId': product_id,
                        'stock': {'$gte': quantity}
                    },
                    {'$inc': {'stock': -quantity}}
                )
                
                if update_result.modified_count > 0:
                    # Record the purchase interaction
                    purchase_interaction = {
                        'userId': 'test_buyer_123',
                        'productId': product_id,
                        'actionType': 'bought',
                        'quantity': quantity,
                        'timestamp': datetime.utcnow(),
                        'session_id': 'purchase_test',
                        'metadata': {'test_purchase': True},
                        'created_at': datetime.utcnow()
                    }
                    
                    purchase_result = interactions_collection.insert_one(purchase_interaction)
                    print(f"   ✅ Purchase interaction recorded: {purchase_result.inserted_id}")
                    
                    # Get updated stock
                    updated_product = products_collection.find_one({'productId': product_id})
                    new_stock = updated_product.get('stock', 0)
                    print(f"   📦 Stock updated: {current_stock} → {new_stock}")
                    
                    # Restore original stock for testing
                    products_collection.update_one(
                        {'productId': product_id},
                        {'$inc': {'stock': quantity}}
                    )
                    print(f"   🔄 Stock restored for testing")
                    
                    inserted_ids.append(purchase_result.inserted_id)
                else:
                    print("   ⚠️ Stock update failed (insufficient stock)")
            else:
                print("   ⚠️ No stock available for testing purchase")
        else:
            print("   ⚠️ No products found for stock testing")
        
        # Test 8: Cleanup test data
        print("\n8. Cleaning up test data...")
        
        # Delete all test interactions
        cleanup_result = interactions_collection.delete_many({
            '$or': [
                {'userId': {'$regex': '^test_'}},
                {'session_id': {'$in': ['test_session_456', 'bulk_test_session', 'purchase_test']}},
                {'metadata.test': True},
                {'metadata.bulk_test': True},
                {'metadata.test_purchase': True}
            ]
        })
        
        print(f"   🗑️ Cleaned up {cleanup_result.deleted_count} test interactions")
        
        # Test 9: Final verification
        print("\n9. Final verification...")
        
        final_count = interactions_collection.count_documents({})
        print(f"   📊 Final interactions count: {final_count}")
        
        # Test connection close
        client.close()
        print("   🔒 MongoDB connection closed")
        
        print("\n🎉 All MongoDB interactions tests completed successfully!")
        return True
        
    except pymongo.errors.ServerSelectionTimeoutError:
        print("❌ MongoDB connection timeout. Check if MongoDB is running and URI is correct.")
        return False
    except pymongo.errors.ConfigurationError as e:
        print(f"❌ MongoDB configuration error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_environment_variables():
    """Test if all required environment variables are set"""
    
    print("🔍 Checking environment variables...")
    
    required_vars = ['MONGODB_URI']
    optional_vars = ['SECRET_KEY', 'JWT_EXPIRATION_DELTA']
    
    missing_vars = []
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: {'*' * 20}...{value[-10:] if len(value) > 30 else value}")
        else:
            print(f"   ❌ {var}: Not set")
            missing_vars.append(var)
    
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            print(f"   ✅ {var}: Set")
        else:
            print(f"   ⚠️ {var}: Not set (optional)")
    
    if missing_vars:
        print(f"\n❌ Missing required environment variables: {missing_vars}")
        print("Please create a .env file with the following variables:")
        for var in missing_vars:
            print(f"   {var}=your_value_here")
        return False
    
    print("✅ All required environment variables are set!")
    return True

def create_sample_env_file():
    """Create a sample .env file"""
    
    sample_content = """# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/walmart_clearance?retryWrites=true&w=majority

# Flask Configuration (Optional)
SECRET_KEY=your-secret-key-here
JWT_EXPIRATION_DELTA=24

# Add other environment variables as needed
"""
    
    if not os.path.exists('.env'):
        with open('.env', 'w') as f:
            f.write(sample_content)
        print("📝 Created sample .env file. Please update it with your actual values.")
    else:
        print("📝 .env file already exists.")

if __name__ == "__main__":
    print("🚀 MongoDB Interactions Database Test")
    print("=" * 50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("⚠️ No .env file found.")
        create_sample_env_file()
        print("Please update the .env file with your MongoDB URI and run the test again.")
        sys.exit(1)
    
    # Test environment variables
    if not test_environment_variables():
        sys.exit(1)
    
    print("\n" + "=" * 50)
    
    # Test MongoDB interactions
    success = test_mongodb_interactions()
    
    print("\n" + "=" * 50)
    
    if success:
        print("🎉 All tests passed! Your MongoDB interactions database is working correctly.")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        sys.exit(1)
