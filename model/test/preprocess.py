import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import csr_matrix
from sklearn.metrics import precision_score, recall_score, f1_score
import pymongo
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import warnings
warnings.filterwarnings('ignore')
from dotenv import load_dotenv
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
def connect_mongodb():
    client = pymongo.MongoClient(MONGODB_URI)
    db = client["walmart_clearance"]
    return db


def generate_sample_data():
    np.random.seed(42)
    
 
    categories = {
        'Skincare': ['Face Cream', 'Moisturizer', 'Sunscreen', 'Anti-aging Serum', 'Cleanser'],
        'Health': ['Vitamin C', 'Pain Relief', 'Multivitamin', 'Protein Powder', 'First Aid'],
        'Haircare': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Mask', 'Styling Gel'],
        'Oral Care': ['Toothpaste', 'Mouthwash', 'Dental Floss', 'Whitening Strips', 'Toothbrush'],
        'Personal Care': ['Hand Sanitizer', 'Body Wash', 'Deodorant', 'Lotion', 'Soap']
    }
    
    products = []
    product_id = 0
    
    for category, items in categories.items():
        for item in items:
            for variant in range(4):  # Create 4 variants of each product
                price = round(np.random.uniform(5, 50), 2)
                expiry_date = datetime.now() + timedelta(days=np.random.randint(1, 180))
                stock = np.random.randint(0, 100)
                days_to_expiry = (expiry_date - datetime.now()).days
                urgency_score = max(0, (30 - days_to_expiry) / 30)
                
                # Create discount for items expiring soon
                discount = 0
                if days_to_expiry <= 7:
                    discount = 0.3
                elif days_to_expiry <= 14:
                    discount = 0.2
                elif days_to_expiry <= 30:
                    discount = 0.1
                
                discounted_price = price * (1 - discount)
                
                products.append({
                    'productId': product_id,
                    'name': f"{item} {variant + 1}",
                    'category': category,
                    'price': price,
                    'discounted_price': discounted_price,
                    'discount': discount,
                    'expiryDate': expiry_date,
                    'stock': stock,
                    'days_to_expiry': days_to_expiry,
                    'urgency_score': urgency_score
                })
                product_id += 1
    
    # Generate user interactions
    user_ids = [f'staff_{i}' for i in range(25)]
    actions = ['viewed', 'added', 'skipped', 'bought']
    action_weights = {'viewed': 0.4, 'added': 0.3, 'skipped': 0.1, 'bought': 0.2}
    
    interactions = []
    for _ in range(1000):
        user = np.random.choice(user_ids)
        product = np.random.choice(range(len(products)))
        action = np.random.choice(actions, p=list(action_weights.values()))
        timestamp = datetime.now() - timedelta(days=np.random.randint(0, 60))
        
        interactions.append({
            'userId': user,
            'productId': product,
            'actionType': action,
            'timestamp': timestamp
        })
    
    return pd.DataFrame(products), pd.DataFrame(interactions)

# Initialize sample data
products_df, interactions_df = generate_sample_data()
print(f"Generated {len(products_df)} products and {len(interactions_df)} interactions")
