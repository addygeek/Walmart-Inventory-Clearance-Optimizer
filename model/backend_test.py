# test_backend.py
import requests
import json

def test_backend():
    base_url = "http://localhost:5000/api"
    
    print("🧪 Testing Backend API")
    print("=" * 40)
    
    # Test health check
    try:
        print("\n1. Testing health check...")
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test products endpoint
    try:
        print("\n2. Testing products endpoint...")
        response = requests.get(f"{base_url}/products?limit=5", timeout=5)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Got {len(data.get('products', []))} products")
            return True
        else:
            print(f"❌ Products endpoint failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Products test failed: {e}")
        return False

if __name__ == "__main__":
    test_backend()
