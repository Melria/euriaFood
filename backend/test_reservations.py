#!/usr/bin/env python3
"""
Test script for reservation functionality
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8001/api"

def test_reservation_functionality():
    print("Testing Reservation Functionality...")
    
    # First, login as admin to get token
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@restaurant.com",
        "password": "admin123"
    })
    
    if login_response.status_code != 200:
        print("❌ Failed to login")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ Login successful")
    
    # Get available tables
    tables_response = requests.get(f"{BASE_URL}/tables", headers=headers)
    if tables_response.status_code != 200:
        print("❌ Failed to get tables")
        return
    
    tables = tables_response.json()
    if not tables:
        print("❌ No tables found")
        return
    
    print(f"✅ Found {len(tables)} tables")
    
    # Test 1: Create a valid reservation
    tomorrow = datetime.now() + timedelta(days=1)
    reservation_time = tomorrow.replace(hour=19, minute=0, second=0, microsecond=0)
    
    valid_reservation = {
        "table_id": tables[0]["id"],
        "date": reservation_time.isoformat(),
        "guests": 2
    }
    
    print("\nTest 1: Creating valid reservation...")
    create_response = requests.post(f"{BASE_URL}/reservations", 
                                  json=valid_reservation, 
                                  headers=headers)
    
    if create_response.status_code == 200:
        print("✅ Valid reservation created successfully")
        reservation_id = create_response.json()["id"]
    else:
        print(f"❌ Failed to create valid reservation: {create_response.text}")
        return
    
    # Test 2: Try to create duplicate reservation (should fail)
    print("\nTest 2: Trying to create duplicate reservation...")
    duplicate_response = requests.post(f"{BASE_URL}/reservations", 
                                     json=valid_reservation, 
                                     headers=headers)
    
    if duplicate_response.status_code == 409:
        print("✅ Duplicate reservation correctly rejected")
    else:
        print(f"❌ Duplicate reservation should have been rejected: {duplicate_response.text}")
    
    # Test 3: Try to create reservation with too many guests (should fail)
    print("\nTest 3: Trying to create reservation with too many guests...")
    table_capacity = tables[0]["seats"]
    too_many_guests = {
        "table_id": tables[0]["id"],
        "date": (reservation_time + timedelta(hours=3)).isoformat(),
        "guests": table_capacity + 1
    }
    
    excess_guests_response = requests.post(f"{BASE_URL}/reservations", 
                                         json=too_many_guests, 
                                         headers=headers)
    
    if excess_guests_response.status_code == 400:
        print("✅ Excess guests reservation correctly rejected")
    else:
        print(f"❌ Excess guests reservation should have been rejected: {excess_guests_response.text}")
    
    # Test 4: Try to create conflicting reservation (should fail)
    print("\nTest 4: Trying to create conflicting reservation...")
    conflicting_reservation = {
        "table_id": tables[0]["id"],
        "date": (reservation_time + timedelta(minutes=30)).isoformat(),  # 30 minutes later
        "guests": 2
    }
    
    conflict_response = requests.post(f"{BASE_URL}/reservations", 
                                    json=conflicting_reservation, 
                                    headers=headers)
    
    if conflict_response.status_code == 409:
        print("✅ Conflicting reservation correctly rejected")
    else:
        print(f"❌ Conflicting reservation should have been rejected: {conflict_response.text}")
    
    # Test 5: Cancel the reservation
    print("\nTest 5: Cancelling reservation...")
    cancel_response = requests.put(f"{BASE_URL}/reservations/{reservation_id}", 
                                 json={"status": "cancelled"}, 
                                 headers=headers)
    
    if cancel_response.status_code == 200:
        print("✅ Reservation cancelled successfully")
    else:
        print(f"❌ Failed to cancel reservation: {cancel_response.text}")
    
    # Test 6: Check table availability
    print("\nTest 6: Checking table availability...")
    availability_response = requests.get(f"{BASE_URL}/tables/availability?date={reservation_time.isoformat()}", 
                                       headers=headers)
    
    if availability_response.status_code == 200:
        availability_data = availability_response.json()
        print(f"✅ Table availability check successful - {len(availability_data['tables'])} tables checked")
    else:
        print(f"❌ Failed to check table availability: {availability_response.text}")
    
    print("\n🎉 All reservation tests completed!")

if __name__ == "__main__":
    test_reservation_functionality()
