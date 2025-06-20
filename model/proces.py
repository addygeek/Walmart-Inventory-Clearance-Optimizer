import os
from flask import Flask, jsonify
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import OneHotEncoder
from dotenv import load_dotenv


# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")
# Flask app
app = Flask(__name__)

# MongoDB connection

client = MongoClient(MONGODB_URI)

# Load MongoDB data
def load_data():
    products = pd.DataFrame(list(client['walmartDB'].products.find()))
    interactions = pd.DataFrame(list(client['walmartDB'].interactions.find()))
    return products, interactions

# Recommend products
def get_recommendations_for_user(user_id):
    products, interactions = load_data()
    
    if products.empty or interactions.empty:
        return []

    products["productId"] = products["productId"].astype(str)
    interactions["productId"] = interactions["productId"].astype(str)

    # One-hot encode categories
    encoder = OneHotEncoder()
    category_encoded = encoder.fit_transform(products[['category']].fillna('Unknown')).toarray()
    category_df = pd.DataFrame(category_encoded, columns=encoder.get_feature_names_out())

    # Normalize numerical features
    numeric = products[["price", "stock", "expiryDays"]].fillna(0)
    normalized = (numeric - numeric.min()) / (numeric.max() - numeric.min())

    # Merge features
    product_features = pd.concat([normalized.reset_index(drop=True), category_df.reset_index(drop=True)], axis=1)

    # Cosine similarity
    similarity_matrix = cosine_similarity(product_features)
    similarity_df = pd.DataFrame(similarity_matrix, index=products['productId'], columns=products['productId'])

    # User history
    user_products = interactions[(interactions["userId"] == user_id) & (interactions["action"].isin(["bought", "viewed"]))]["productId"]
    if user_products.empty:
        return []

    # Compute recommendations
    scores = similarity_df.loc[user_products].sum().sort_values(ascending=False)
    scores = scores[~scores.index.isin(user_products)]
    top_ids = scores.head(3).index.tolist()

    # Return recommended products
    recommendations = products[products["productId"].isin(top_ids)]
    return recommendations[["productId", "name", "category", "price", "expiryDays", "stock"]].to_dict(orient="records")

# API route
@app.route('/recommend/<user_id>')
def recommend(user_id):
    result = get_recommendations_for_user(user_id)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
