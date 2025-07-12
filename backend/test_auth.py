#!/usr/bin/env python3
"""
Simple test script to check authentication and menu creation
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_auth_and_menu():
    print("Testing EURIA Food Backend Authentication...")
    
    # Test 1: Login with admin credentials
    print("\n1. Testing admin login...")
    login_data = {
        "email": "admin@restaurant.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            login_result = response.json()
            token = login_result.get("access_token")
            user = login_result.get("user")
            print(f"Login successful! User: {user.get('name')} ({user.get('role')})")
            print(f"Token: {token[:50]}...")
            
            # Test 2: Test menu creation with token
            print("\n2. Testing menu item creation...")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            menu_item = {
                "name": "Test Burger API",
                "description": "Test burger created via API",
                "price": 15.99,
                "category": "Plats",
                "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd",
                "available": True
            }
            
            response = requests.post(f"{BASE_URL}/api/menu", json=menu_item, headers=headers)
            print(f"Menu creation response status: {response.status_code}")
            
            if response.status_code == 200:
                print("Menu item created successfully!")
                print(f"Response: {response.json()}")
            else:
                print(f"Error creating menu item: {response.text}")
                
            # Test 3: Get menu items
            print("\n3. Testing menu retrieval...")
            response = requests.get(f"{BASE_URL}/api/menu")
            print(f"Menu retrieval status: {response.status_code}")
            
            if response.status_code == 200:
                menu_items = response.json()
                print(f"Found {len(menu_items)} menu items")
                for item in menu_items[:3]:  # Show first 3 items
                    print(f"  - {item.get('name')}: {item.get('price')}€")
            else:
                print(f"Error retrieving menu: {response.text}")
                
        else:
            print(f"Login failed: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend server.")
        print("Make sure the backend server is running on http://localhost:8001")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_auth_and_menu()
