# test_api.py
import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://localhost:5000/api'

def test_api():
    """Test all API endpoints"""
    
    print("🧪 Testing Walmart Clearance Optimizer API")
    print("=" * 50)
    
    # Test health check
    print("\n1. Testing health check...")
    response = requests.get(f'{BASE_URL}/health')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    
    # Test user registration
    print("\n2. Testing user registration...")
    user_data = {
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'password123',
        'role': 'staff'
    }
    
    response = requests.post(f'{BASE_URL}/auth/register', json=user_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        auth_data = response.json()
        token = auth_data['token']
        print("✅ User registered successfully!")
    else:
        print(f"❌ Registration failed: {response.json()}")
        return
    
    # Test adding a product
    print("\n3. Testing add product...")
    headers = {'Authorization': f'Bearer {token}'}
    product_data = {
        'name': 'Test Face Cream',
        'category': 'Skincare',
        'price': 25.99,
        'expiryDate': (datetime.now() + timedelta(days=10)).isoformat(),
        'stock': 50,
        'description': 'Premium face cream for daily use'
    }
    
    response = requests.post(f'{BASE_URL}/products', json=product_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        product_result = response.json()
        product_id = product_result['productId']
        print(f"✅ Product added with ID: {product_id}")
    else:
        print(f"❌ Add product failed: {response.json()}")
        return
    
    # Test getting products
    print("\n4. Testing get products...")
    response = requests.get(f'{BASE_URL}/products?limit=5')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        products_data = response.json()
        print(f"✅ Retrieved {len(products_data['products'])} products")
    else:
        print(f"❌ Get products failed: {response.json()}")
    
    # Test adding interaction
    print("\n5. Testing add interaction...")
    interaction_data = {
        'userId': 'staff_1',
        'productId': product_id,
        'actionType': 'viewed'
    }
    
    response = requests.post(f'{BASE_URL}/interactions', json=interaction_data)
    print(f"Status: {response.status_code}")
    if response.status_code == 201:
        print("✅ Interaction recorded successfully!")
    else:
        print(f"❌ Add interaction failed: {response.json()}")
    
    # Test recommendations
    print("\n6. Testing recommendations...")
    response = requests.get(f'{BASE_URL}/recommendations/staff_1?top_k=5')
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        rec_data = response.json()
        print(f"✅ Generated {len(rec_data['recommendations'])} recommendations")
    else:
        print(f"❌ Get recommendations failed: {response.json()}")
    
    print("\n🎉 API testing completed!")

if __name__ == '__main__':
    test_api()
