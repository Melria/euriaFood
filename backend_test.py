import requests
import json
import uuid
from datetime import datetime, timedelta
import time
import sys

class RestaurantAPITester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.user_role = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({"name": name, "status": "PASS"})
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                self.test_results.append({"name": name, "status": "FAIL", "error": f"Expected {expected_status}, got {response.status_code}"})

            try:
                return success, response.json() if response.text else {}
            except json.JSONDecodeError:
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"name": name, "status": "FAIL", "error": str(e)})
            return False, {}

    def test_register(self, email, password, name, role="client"):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": email, "password": password, "name": name, "role": role},
            auth=False
        )
        return success

    def test_login(self, email, password):
        """Test login and get token"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password},
            auth=False
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.user_role = response['user']['role']
            return True
        return False

    def test_get_menu(self):
        """Test getting menu items"""
        success, response = self.run_test(
            "Get Menu",
            "GET",
            "menu",
            200,
            auth=False
        )
        return success, response

    def test_get_menu_categories(self):
        """Test getting menu categories"""
        success, response = self.run_test(
            "Get Menu Categories",
            "GET",
            "menu/categories",
            200,
            auth=False
        )
        return success, response

    def test_create_order(self, menu_items):
        """Test creating an order"""
        if not menu_items:
            print("❌ No menu items available to create an order")
            self.test_results.append({"name": "Create Order", "status": "SKIP", "error": "No menu items available"})
            return False, {}
        
        # Create order with first menu item
        item = menu_items[0]
        order_data = {
            "items": [
                {
                    "menu_item_id": item["id"],
                    "quantity": 2,
                    "price": item["price"]
                }
            ],
            "total": item["price"] * 2
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        return success, response

    def test_get_orders(self):
        """Test getting user orders"""
        success, response = self.run_test(
            "Get Orders",
            "GET",
            "orders",
            200
        )
        return success, response

    def test_get_tables(self):
        """Test getting tables"""
        success, response = self.run_test(
            "Get Tables",
            "GET",
            "tables",
            200,
            auth=False
        )
        return success, response

    def test_create_reservation(self, table_id):
        """Test creating a reservation"""
        reservation_date = (datetime.now() + timedelta(days=1)).isoformat()
        reservation_data = {
            "table_id": table_id,
            "date": reservation_date,
            "guests": 2
        }
        
        success, response = self.run_test(
            "Create Reservation",
            "POST",
            "reservations",
            200,
            data=reservation_data
        )
        return success, response

    def test_get_reservations(self):
        """Test getting user reservations"""
        success, response = self.run_test(
            "Get Reservations",
            "GET",
            "reservations",
            200
        )
        return success, response

    def test_admin_dashboard_stats(self):
        """Test getting admin dashboard stats"""
        if self.user_role != "admin":
            print("⚠️ Skipping admin stats test - not an admin user")
            self.test_results.append({"name": "Admin Dashboard Stats", "status": "SKIP", "error": "Not an admin user"})
            return False, {}
            
        success, response = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "stats/dashboard",
            200
        )
        return success, response

    def test_update_order_status(self, order_id):
        """Test updating order status (admin only)"""
        if self.user_role != "admin":
            print("⚠️ Skipping update order status test - not an admin user")
            self.test_results.append({"name": "Update Order Status", "status": "SKIP", "error": "Not an admin user"})
            return False, {}
            
        success, response = self.run_test(
            "Update Order Status",
            "PUT",
            f"orders/{order_id}/status?status=confirmed",
            200
        )
        return success, response

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*50)
        
        if self.tests_passed == self.tests_run:
            print("✅ All tests passed!")
        else:
            print("❌ Some tests failed:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"  - {result['name']}: {result.get('error', 'Unknown error')}")
        
        return self.tests_passed == self.tests_run

def main():
    # Get backend URL from frontend .env file
    backend_url = "https://10ac77f8-0514-4bea-b7e7-8031840e471b.preview.emergentagent.com"
    
    # Create API tester
    tester = RestaurantAPITester(backend_url)
    
    # Generate unique test user
    test_email = f"test_user_{int(time.time())}@example.com"
    test_password = "Test123!"
    test_name = "Test User"
    
    # Test user registration
    if not tester.test_register(test_email, test_password, test_name):
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Test user login
    if not tester.test_login(test_email, test_password):
        print("❌ Login failed, stopping tests")
        return 1
    
    # Test admin login
    admin_tester = RestaurantAPITester(backend_url)
    if not admin_tester.test_login("admin@restaurant.com", "admin123"):
        print("❌ Admin login failed, continuing with regular user tests")
    
    # Test menu endpoints
    success, menu_items = tester.test_get_menu()
    if not success:
        print("❌ Get menu failed")
    
    tester.test_get_menu_categories()
    
    # Test order endpoints
    success, order = tester.test_create_order(menu_items)
    if success and order:
        tester.test_get_orders()
        
        # Test admin update order status
        if admin_tester.token:
            admin_tester.test_update_order_status(order["id"])
    
    # Test table endpoints
    success, tables = tester.test_get_tables()
    
    # Test reservation endpoints
    if success and tables:
        tester.test_create_reservation(tables[0]["id"])
        tester.test_get_reservations()
    
    # Test admin dashboard stats
    if admin_tester.token:
        admin_tester.test_admin_dashboard_stats()
    
    # Print test summary
    success = tester.print_summary()
    if admin_tester.token:
        admin_tester.print_summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())