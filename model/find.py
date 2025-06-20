from pymongo import MongoClient
from dotenv import load_dotenv
import os

# ✅ Load environment variables from .env
load_dotenv()

# ✅ Get your MongoDB URI
MONGODB_URI = os.getenv("MONGODB_URI")

# ✅ Connect to MongoDB
client = MongoClient(MONGODB_URI)

# ✅ Access the database and collection
db = client["walmart_clearance"]            # Your database name
collection = db["products"]                 # Your collection name

# ✅ Query to find product with name 'Conditioner Pro'
product = collection.find_one({"name": "Conditioner Pro"})

# ✅ Print the result
if product:
    print("✅ Product found:")
    print(product)
else:
    print("❌ Product not found.")
