# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from bson import ObjectId
import json
import os
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this in production
app.config['JWT_EXPIRATION_DELTA'] = timedelta(hours=24)
from dotenv import load_dotenv


# Load environment variables
load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI")

# MongoDB remote connection string
MONGO_URI = MONGODB_URI
# Replace with your actual MongoDB Atlas connection string

try:
    client = pymongo.MongoClient(MONGO_URI)
    db = client['walmart_clearance']
    
    # Collections
    products_collection = db['products']
    interactions_collection = db['interactions']
    users_collection = db['users']
    recommendations_collection = db['recommendations']
    analytics_collection = db['analytics']
    
    print("✅ Connected to MongoDB successfully!")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")

# Helper Functions
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    
    if isinstance(doc, dict):
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                doc[key] = str(value)
            elif isinstance(value, datetime):
                doc[key] = value.isoformat()
            elif isinstance(value, dict):
                doc[key] = serialize_doc(value)
            elif isinstance(value, list):
                doc[key] = serialize_doc(value)
    
    return doc

def calculate_urgency_score(expiry_date):
    """Calculate urgency score based on expiry date"""
    if isinstance(expiry_date, str):
        expiry_date = datetime.fromisoformat(expiry_date.replace('Z', '+00:00'))
    
    days_to_expiry = (expiry_date - datetime.now()).days
    urgency_score = max(0, (30 - days_to_expiry) / 30)
    return urgency_score, days_to_expiry

def calculate_discount(days_to_expiry):
    """Calculate discount based on days to expiry"""
    if days_to_expiry <= 3:
        return 0.4  # 40% off
    elif days_to_expiry <= 7:
        return 0.3  # 30% off
    elif days_to_expiry <= 14:
        return 0.2  # 20% off
    elif days_to_expiry <= 30:
        return 0.1  # 10% off
    return 0

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Routes

# Health Check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'database': 'connected' if client else 'disconnected'
    })

# User Authentication
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        required_fields = ['username', 'email', 'password', 'role']
        
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if user already exists
        if users_collection.find_one({'email': data['email']}):
            return jsonify({'error': 'User already exists'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(data['password'])
        
        user_doc = {
            'username': data['username'],
            'email': data['email'],
            'password': hashed_password,
            'role': data['role'],  # 'staff', 'manager', 'admin'
            'created_at': datetime.now(),
            'preferences': {
                'categories': [],
                'notification_settings': {
                    'email': True,
                    'push': True
                }
            }
        }
        
        result = users_collection.insert_one(user_doc)
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': str(result.inserted_id),
            'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': str(result.inserted_id),
                'username': data['username'],
                'email': data['email'],
                'role': data['role']
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        user = users_collection.find_one({'email': data['email']})
        
        if not user or not check_password_hash(user['password'], data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA']
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Product Management
@app.route('/api/products', methods=['POST'])
@token_required
def add_product(current_user):
    try:
        data = request.json
        required_fields = ['name', 'category', 'price', 'expiryDate', 'stock']
        
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required product fields'}), 400
        
        # Convert expiryDate to datetime
        try:
            expiry_date = datetime.fromisoformat(data['expiryDate'].replace('Z', '+00:00'))
        except Exception as e:
            return jsonify({'error': 'Invalid expiryDate format. Use ISO format.'}), 400
        
        # Calculate derived fields
        urgency_score, days_to_expiry = calculate_urgency_score(expiry_date)
        discount = calculate_discount(days_to_expiry)
        discounted_price = data['price'] * (1 - discount)
        
        product_doc = {
            'productId': data.get('productId', str(ObjectId())),
            'name': data['name'],
            'category': data['category'],
            'price': float(data['price']),
            'discounted_price': discounted_price,
            'discount': discount,
            'expiryDate': expiry_date,
            'stock': int(data['stock']),
            'days_to_expiry': days_to_expiry,
            'urgency_score': urgency_score,
            'description': data.get('description', ''),
            'sku': data.get('sku', ''),
            'supplier': data.get('supplier', ''),
            'location': data.get('location', ''),
            'created_at': datetime.now(),
            'created_by': str(current_user['_id']),
            'status': 'active'
        }
        
        result = products_collection.insert_one(product_doc)
        
        # Log analytics
        analytics_collection.insert_one({
            'event_type': 'product_added',
            'user_id': str(current_user['_id']),
            'product_id': product_doc['productId'],
            'timestamp': datetime.now(),
            'metadata': {
                'category': data['category'],
                'price': data['price']
            }
        })
        
        return jsonify({
            'message': 'Product added successfully',
            'productId': product_doc['productId'],
            'id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# app.py - Updated products endpoint
@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        # Query parameters
        category = request.args.get('category')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort', 'urgency')
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        urgent_only = request.args.get('urgent_only', 'false').lower() == 'true'
        discount_only = request.args.get('discount_only', 'false').lower() == 'true'
        
        print(f"🔍 Fetching products from MongoDB...")
        print(f"Database: {db.name}")
        print(f"Collection: products")
        
        # Check if we have any products in database
        total_products = products_collection.count_documents({})
        print(f"📊 Total products in database: {total_products}")
        
        if total_products == 0:
            return jsonify({
                'products': [],
                'total_count': 0,
                'message': 'No products found in database. Please run init_db.py to populate data.',
                'database_empty': True
            })
        
        # Build query
        query = {'status': 'active'}
        
        if category:
            query['category'] = category
        
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'category': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        if urgent_only:
            query['days_to_expiry'] = {'$lte': 7}
        
        if discount_only:
            query['discount'] = {'$gt': 0}
        
        print(f"🔎 Query: {query}")
        
        # Build sort
        sort_options = {
            'urgency': [('urgency_score', -1)],
            'price_low': [('discounted_price', 1)],
            'price_high': [('discounted_price', -1)],
            'stock': [('stock', 1)],
            'expiry': [('days_to_expiry', 1)],
            'name': [('name', 1)],
            'created': [('created_at', -1)]
        }
        
        sort_criteria = sort_options.get(sort_by, [('urgency_score', -1)])
        
        # Execute query
        products = list(products_collection.find(query)
                       .sort(sort_criteria)
                       .skip(skip)
                       .limit(limit))
        
        print(f"✅ Found {len(products)} products in database")
        
        # Update calculated fields for current time
        for product in products:
            if 'expiryDate' in product:
                urgency_score, days_to_expiry = calculate_urgency_score(product['expiryDate'])
                discount = calculate_discount(days_to_expiry)
                
                product['urgency_score'] = urgency_score
                product['days_to_expiry'] = days_to_expiry
                product['discount'] = discount
                product['discounted_price'] = product['price'] * (1 - discount)
        
        # Get total count
        total_count = products_collection.count_documents(query)
        
        return jsonify({
            'products': serialize_doc(products),
            'total_count': total_count,
            'page_info': {
                'limit': limit,
                'skip': skip,
                'has_more': (skip + limit) < total_count
            },
            'database_empty': False,
            'message': f'Loaded {len(products)} real products from MongoDB'
        })
        
    except Exception as e:
        print(f"❌ Error in get_products: {e}")
        return jsonify({'error': str(e)}), 500

# Add endpoint to check database status
@app.route('/api/database/status', methods=['GET'])
def database_status():
    try:
        # Check MongoDB connection
        client.admin.command('ping')
        
        # Count documents in each collection
        products_count = products_collection.count_documents({})
        interactions_count = interactions_collection.count_documents({})
        users_count = users_collection.count_documents({})
        
        return jsonify({
            'status': 'connected',
            'database': db.name,
            'collections': {
                'products': products_count,
                'interactions': interactions_count,
                'users': users_count
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

# Add endpoint to populate database if empty
@app.route('/api/database/populate', methods=['POST'])
def populate_database():
    try:
        # Check if database is empty
        products_count = products_collection.count_documents({})
        
        if products_count > 0:
            return jsonify({
                'message': f'Database already has {products_count} products',
                'populated': False
            })
        
        # Generate and insert sample data
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
            category = np.random.choice(categories)
            product_name = np.random.choice(product_names[category])
            
            days_to_expiry = np.random.randint(1, 180)
            expiry_date = datetime.utcnow() + timedelta(days=days_to_expiry)
            price = round(np.random.uniform(5, 100), 2)
            
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
                'name': f'{product_name} {np.random.choice(["Premium", "Classic", "Advanced", "Pro", "Ultra"])}',
                'category': category,
                'price': price,
                'discounted_price': round(price * (1 - discount), 2),
                'discount': discount,
                'expiryDate': expiry_date,
                'stock': np.random.randint(0, 100),
                'days_to_expiry': days_to_expiry,
                'urgency_score': urgency_score,
                'description': f'High-quality {category.lower()} product for daily use',
                'sku': f'SKU{i+1:06d}',
                'supplier': f'Supplier {np.random.randint(1, 10)}',
                'location': f'Aisle {np.random.randint(1, 20)}-{np.random.randint(1, 10)}',
                'created_at': datetime.utcnow(),
                'status': 'active'
            }
            sample_products.append(product)
        
        # Insert products in batches
        batch_size = 20
        inserted_count = 0
        
        for i in range(0, len(sample_products), batch_size):
            batch = sample_products[i:i + batch_size]
            result = products_collection.insert_many(batch)
            inserted_count += len(result.inserted_ids)
        
        return jsonify({
            'message': f'Successfully populated database with {inserted_count} products',
            'populated': True,
            'products_count': inserted_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    try:
        # Query parameters
        category = request.args.get('category')
        search = request.args.get('search', '')
        sort_by = request.args.get('sort', 'urgency')
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        urgent_only = request.args.get('urgent_only', 'false').lower() == 'true'
        discount_only = request.args.get('discount_only', 'false').lower() == 'true'
        
        # Build query
        query = {'status': 'active'}
        
        if category:
            query['category'] = category
        
        if search:
            query['$or'] = [
                {'name': {'$regex': search, '$options': 'i'}},
                {'category': {'$regex': search, '$options': 'i'}},
                {'description': {'$regex': search, '$options': 'i'}}
            ]
        
        if urgent_only:
            query['days_to_expiry'] = {'$lte': 7}
        
        if discount_only:
            query['discount'] = {'$gt': 0}
        
        # Build sort
        sort_options = {
            'urgency': [('urgency_score', -1)],
            'price_low': [('discounted_price', 1)],
            'price_high': [('discounted_price', -1)],
            'stock': [('stock', 1)],
            'expiry': [('days_to_expiry', 1)],
            'name': [('name', 1)],
            'created': [('created_at', -1)]
        }
        
        sort_criteria = sort_options.get(sort_by, [('urgency_score', -1)])
        
        # Execute query
        products = list(products_collection.find(query)
                       .sort(sort_criteria)
                       .skip(skip)
                       .limit(limit))
        
        # Update calculated fields for current time
        for product in products:
            if 'expiryDate' in product:
                urgency_score, days_to_expiry = calculate_urgency_score(product['expiryDate'])
                discount = calculate_discount(days_to_expiry)
                
                product['urgency_score'] = urgency_score
                product['days_to_expiry'] = days_to_expiry
                product['discount'] = discount
                product['discounted_price'] = product['price'] * (1 - discount)
        
        # Get total count
        total_count = products_collection.count_documents(query)
        
        return jsonify({
            'products': serialize_doc(products),
            'total_count': total_count,
            'page_info': {
                'limit': limit,
                'skip': skip,
                'has_more': (skip + limit) < total_count
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = products_collection.find_one({'productId': product_id})
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update calculated fields
        if 'expiryDate' in product:
            urgency_score, days_to_expiry = calculate_urgency_score(product['expiryDate'])
            discount = calculate_discount(days_to_expiry)
            
            product['urgency_score'] = urgency_score
            product['days_to_expiry'] = days_to_expiry
            product['discount'] = discount
            product['discounted_price'] = product['price'] * (1 - discount)
        
        return jsonify(serialize_doc(product))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    try:
        data = request.json
        
        # Find existing product
        existing_product = products_collection.find_one({'productId': product_id})
        if not existing_product:
            return jsonify({'error': 'Product not found'}), 404
        
        # Update fields
        update_doc = {'updated_at': datetime.now(), 'updated_by': str(current_user['_id'])}
        
        if 'name' in data:
            update_doc['name'] = data['name']
        if 'category' in data:
            update_doc['category'] = data['category']
        if 'price' in data:
            update_doc['price'] = float(data['price'])
        if 'stock' in data:
            update_doc['stock'] = int(data['stock'])
        if 'description' in data:
            update_doc['description'] = data['description']
        if 'expiryDate' in data:
            expiry_date = datetime.fromisoformat(data['expiryDate'].replace('Z', '+00:00'))
            update_doc['expiryDate'] = expiry_date
            
            # Recalculate derived fields
            urgency_score, days_to_expiry = calculate_urgency_score(expiry_date)
            discount = calculate_discount(days_to_expiry)
            
            update_doc['urgency_score'] = urgency_score
            update_doc['days_to_expiry'] = days_to_expiry
            update_doc['discount'] = discount
            update_doc['discounted_price'] = update_doc.get('price', existing_product['price']) * (1 - discount)
        
        result = products_collection.update_one(
            {'productId': product_id},
            {'$set': update_doc}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'No changes made'}), 400
        
        return jsonify({'message': 'Product updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    try:
        # Soft delete - mark as inactive
        result = products_collection.update_one(
            {'productId': product_id},
            {'$set': {
                'status': 'deleted',
                'deleted_at': datetime.now(),
                'deleted_by': str(current_user['_id'])
            }}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({'message': 'Product deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Interactions
@app.route('/api/interactions', methods=['POST'])
def add_interaction():
    try:
        data = request.json
        required_fields = ['userId', 'productId', 'actionType']
        
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required interaction fields'}), 400

        valid_actions = ['viewed', 'added', 'skipped', 'bought', 'favorited', 'shared']
        if data['actionType'] not in valid_actions:
            return jsonify({'error': f'Invalid actionType. Must be one of: {valid_actions}'}), 400

        # Handle stock reduction for 'bought' action
        if data['actionType'] == 'bought':
            quantity = data.get('quantity', 1)
            
            # Get current product
            product = products_collection.find_one({'productId': data['productId']})
            if not product:
                return jsonify({'error': 'Product not found', 'can_sell': False}), 404

            current_stock = product.get('stock', 0)
            
            # Check if sufficient stock
            if current_stock < quantity:
                return jsonify({
                    'error': 'Insufficient stock', 
                    'can_sell': False,
                    'current_stock': current_stock
                }), 400

            if current_stock == 0:
                return jsonify({
                    'error': 'Product is out of stock', 
                    'can_sell': False,
                    'current_stock': 0
                }), 400

            # Atomic stock decrement to prevent race conditions
            update_result = products_collection.update_one(
                {
                    'productId': data['productId'], 
                    'stock': {'$gte': quantity}
                },
                {'$inc': {'stock': -quantity}}
            )

            if update_result.modified_count == 0:
                return jsonify({
                    'error': 'Stock became insufficient during transaction', 
                    'can_sell': False
                }), 400

            # Get updated product to return new stock
            updated_product = products_collection.find_one({'productId': data['productId']})
            new_stock = updated_product.get('stock', 0)

        # Record the interaction
        interaction_doc = {
            'userId': data['userId'],
            'productId': data['productId'],
            'actionType': data['actionType'],
            'quantity': data.get('quantity', 1) if data['actionType'] == 'bought' else None,
            'timestamp': datetime.utcnow(),
            'session_id': data.get('session_id'),
            'metadata': data.get('metadata', {})
        }
        
        result = interactions_collection.insert_one(interaction_doc)

        # Return response with updated stock info
        response_data = {
            'message': 'Interaction recorded successfully',
            'interactionId': str(result.inserted_id),
            'can_sell': True
        }

        # Add stock info for 'bought' actions
        if data['actionType'] == 'bought':
            response_data.update({
                'new_stock': new_stock,
                'quantity_sold': quantity,
                'stock_updated': True
            })

        return jsonify(response_data), 201

    except Exception as e:
        return jsonify({'error': str(e), 'can_sell': False}), 500


@app.route('/api/interactions', methods=['GET'])
def get_interactions():
    try:
        user_id = request.args.get('userId')
        product_id = request.args.get('productId')
        action_type = request.args.get('actionType')
        limit = int(request.args.get('limit', 100))
        skip = int(request.args.get('skip', 0))
        
        query = {}
        if user_id:
            query['userId'] = user_id
        if product_id:
            query['productId'] = product_id
        if action_type:
            query['actionType'] = action_type
        
        interactions = list(interactions_collection.find(query)
                          .sort([('timestamp', -1)])
                          .skip(skip)
                          .limit(limit))
        
        total_count = interactions_collection.count_documents(query)
        
        return jsonify({
            'interactions': serialize_doc(interactions),
            'total_count': total_count
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Recommendations
@app.route('/api/recommendations/<user_id>', methods=['GET'])
def get_recommendations(user_id):
    try:
        top_k = int(request.args.get('top_k', 10))
        rec_type = request.args.get('type', 'hybrid')
        
        # Get user's interaction history
        user_interactions = list(interactions_collection.find({'userId': user_id}))
        
        # Get user's preferred categories
        preferred_categories = []
        category_counts = {}
        
        for interaction in user_interactions:
            if interaction['actionType'] in ['added', 'bought', 'favorited']:
                product = products_collection.find_one({'productId': interaction['productId']})
                if product and 'category' in product:
                    category = product['category']
                    category_counts[category] = category_counts.get(category, 0) + 1
        
        # Sort categories by interaction count
        preferred_categories = sorted(category_counts.keys(), 
                                    key=lambda x: category_counts[x], 
                                    reverse=True)[:3]
        
        # Build recommendation query
        query = {'status': 'active', 'stock': {'$gt': 0}}
        
        if rec_type == 'urgent':
            query['days_to_expiry'] = {'$lte': 7}
        elif rec_type == 'discount':
            query['discount'] = {'$gt': 0}
        elif rec_type == 'category' and preferred_categories:
            query['category'] = {'$in': preferred_categories}
        
        # Get products
        if rec_type == 'hybrid':
            # Combine urgent + preferred categories + discounted
            urgent_products = list(products_collection.find({
                **query,
                'days_to_expiry': {'$lte': 7}
            }).limit(top_k // 3))
            
            category_products = list(products_collection.find({
                **query,
                'category': {'$in': preferred_categories}
            }).limit(top_k // 3)) if preferred_categories else []
            
            discount_products = list(products_collection.find({
                **query,
                'discount': {'$gt': 0}
            }).limit(top_k // 3))
            
            # Combine and deduplicate
            all_products = urgent_products + category_products + discount_products
            seen_ids = set()
            recommendations = []
            
            for product in all_products:
                if product['productId'] not in seen_ids:
                    seen_ids.add(product['productId'])
                    recommendations.append(product)
                    if len(recommendations) >= top_k:
                        break
        else:
            recommendations = list(products_collection.find(query)
                                 .sort([('urgency_score', -1)])
                                 .limit(top_k))
        
        # Update calculated fields
        for product in recommendations:
            if 'expiryDate' in product:
                urgency_score, days_to_expiry = calculate_urgency_score(product['expiryDate'])
                discount = calculate_discount(days_to_expiry)
                
                product['urgency_score'] = urgency_score
                product['days_to_expiry'] = days_to_expiry
                product['discount'] = discount
                product['discounted_price'] = product['price'] * (1 - discount)
        
        # Cache recommendations
        recommendations_collection.update_one(
            {'userId': user_id, 'type': rec_type},
            {
                '$set': {
                    'userId': user_id,
                    'type': rec_type,
                    'recommendations': [p['productId'] for p in recommendations],
                    'generated_at': datetime.now(),
                    'expires_at': datetime.now() + timedelta(hours=1)
                }
            },
            upsert=True
        )
        
        return jsonify({
            'user_id': user_id,
            'type': rec_type,
            'recommendations': serialize_doc(recommendations),
            'preferred_categories': preferred_categories,
            'count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics and Statistics
@app.route('/api/analytics/dashboard', methods=['GET'])
@token_required
def get_dashboard_analytics(current_user):
    try:
        # Product statistics
        total_products = products_collection.count_documents({'status': 'active'})
        urgent_products = products_collection.count_documents({
            'status': 'active',
            'days_to_expiry': {'$lte': 7}
        })
        discounted_products = products_collection.count_documents({
            'status': 'active',
            'discount': {'$gt': 0}
        })
        low_stock_products = products_collection.count_documents({
            'status': 'active',
            'stock': {'$lt': 10}
        })
        
        # Calculate total inventory value
        pipeline = [
            {'$match': {'status': 'active'}},
            {'$group': {
                '_id': None,
                'total_value': {'$sum': {'$multiply': ['$price', '$stock']}},
                'total_discounted_value': {'$sum': {'$multiply': ['$discounted_price', '$stock']}}
            }}
        ]
        
        value_result = list(products_collection.aggregate(pipeline))
        total_value = value_result[0]['total_value'] if value_result else 0
        total_discounted_value = value_result[0]['total_discounted_value'] if value_result else 0
        
        # Recent interactions
        recent_interactions = interactions_collection.count_documents({
            'timestamp': {'$gte': datetime.now() - timedelta(days=7)}
        })
        
        # Category breakdown
        category_pipeline = [
            {'$match': {'status': 'active'}},
            {'$group': {
                '_id': '$category',
                'count': {'$sum': 1},
                'urgent_count': {
                    '$sum': {'$cond': [{'$lte': ['$days_to_expiry', 7]}, 1, 0]}
                }
            }},
            {'$sort': {'count': -1}}
        ]
        
        categories = list(products_collection.aggregate(category_pipeline))
        
        return jsonify({
            'summary': {
                'total_products': total_products,
                'urgent_products': urgent_products,
                'discounted_products': discounted_products,
                'low_stock_products': low_stock_products,
                'total_value': total_value,
                'total_discounted_value': total_discounted_value,
                'potential_savings': total_value - total_discounted_value,
                'recent_interactions': recent_interactions
            },
            'categories': categories,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Bulk Operations
@app.route('/api/products/bulk', methods=['POST'])
@token_required
def bulk_operations(current_user):
    try:
        data = request.json
        operation = data.get('operation')
        product_ids = data.get('product_ids', [])
        
        if not operation or not product_ids:
            return jsonify({'error': 'Operation and product_ids required'}), 400
        
        valid_operations = ['mark_sold', 'update_stock', 'apply_discount', 'delete']
        if operation not in valid_operations:
            return jsonify({'error': f'Invalid operation. Must be one of: {valid_operations}'}), 400
        
        results = []
        
        if operation == 'mark_sold':
            quantity = data.get('quantity', 1)
            
            for product_id in product_ids:
                # CHECK STOCK BEFORE MARKING AS SOLD
                product = products_collection.find_one({'productId': product_id})
                if not product:
                    results.append({'product_id': product_id, 'error': 'Product not found', 'sold': False})
                    continue
                
                current_stock = product.get('stock', 0)
                
                if current_stock < quantity:
                    results.append({
                        'product_id': product_id, 
                        'error': f'Insufficient stock. Available: {current_stock}',
                        'sold': False,
                        'available_stock': current_stock
                    })
                    continue
                
                if current_stock == 0:
                    results.append({
                        'product_id': product_id, 
                        'error': 'Product is out of stock',
                        'sold': False,
                        'available_stock': 0
                    })
                    continue
                
                # Use atomic operation
                update_result = products_collection.update_one(
                    {
                        'productId': product_id,
                        'stock': {'$gte': quantity}
                    },
                    {'$inc': {'stock': -quantity}}
                )
                
                if update_result.modified_count > 0:
                    results.append({'product_id': product_id, 'sold': True, 'quantity_sold': quantity})
                else:
                    results.append({'product_id': product_id, 'error': 'Stock insufficient during transaction', 'sold': False})
        
        
        return jsonify({
            'message': f'Bulk {operation} completed',
            'results': results,
            'total_processed': len(results),
            'successful': sum(1 for r in results if r.get('sold', r.get('modified', False)))
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
