import pymongo
from datetime import datetime
from dotenv import load_dotenv


# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
# Your MongoDB connection string
MONGO_URI = MONGODB_URI

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client['walmart_clearance']
    products_collection = db['products']
    
    # Test connection
    client.admin.command('ping')
    print("✅ MongoDB connection successful!")
    
    # Check products count
    count = products_collection.count_documents({})
    print(f"📊 Products in database: {count}")
    
    if count == 0:
        print("⚠️ Database is empty! Run init_db.py to populate data.")
    else:
        # Show first few products
        products = list(products_collection.find({}).limit(3))
        print("📦 Sample products:")
        for product in products:
            print(f"  - {product.get('name', 'Unknown')} ({product.get('category', 'Unknown')})")
    
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
