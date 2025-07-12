# 401 Unauthorized Error - Troubleshooting Guide

## Problem Analysis
You're getting a 401 Unauthorized error when adding menu items, even though you've successfully added some items before. This indicates an authentication issue.

## Most Likely Causes

### 1. **Token Expiration** (FIXED)
- **Issue**: JWT tokens were expiring after 15 minutes
- **Solution**: Extended token expiration to 24 hours
- **Fix Applied**: Modified `create_access_token()` function

### 2. **Browser Token Storage Issues**
- **Check**: Open browser Developer Tools > Application > Local Storage
- **Look for**: `token` and `user` entries
- **Problem**: Token might be corrupted or missing

### 3. **Duplicate Route Definitions** (FIXED)
- **Issue**: Multiple route definitions causing conflicts
- **Solution**: Removed duplicate routes from server.py
- **Fix Applied**: Cleaned up duplicate `/reviews`, `/favorites`, etc.

## Quick Fixes

### Method 1: Re-login (RECOMMENDED)
1. Log out of the application
2. Log back in with admin credentials:
   - Email: `admin@restaurant.com`
   - Password: `admin123`
3. Try adding a menu item again

### Method 2: Clear Browser Data
1. Open Developer Tools (F12)
2. Go to Application > Storage
3. Clear Local Storage for your site
4. Refresh the page and login again

### Method 3: Check Token in Browser
1. Open Developer Tools (F12)
2. Go to Application > Local Storage
3. Check if `token` exists and looks valid (long string starting with "eyJ")
4. If missing or corrupted, logout and login again

## Testing the Fix

### Option 1: Use Test Script
1. Make sure backend server is running
2. Run the test script:
   ```bash
   cd backend
   python test_auth.py
   ```

### Option 2: Manual Test
1. Start backend server: `python server.py`
2. Go to `http://localhost:8001/docs`
3. Test authentication endpoints

## Backend Server Status Check

### Start the Server
1. Open Command Prompt in the backend folder
2. Run: `python server.py`
3. Look for: "Uvicorn running on http://0.0.0.0:8001"

### Verify API Endpoints
1. Go to: `http://localhost:8001/docs`
2. You should see FastAPI documentation
3. Test the `/api/auth/login` endpoint

## Changes Made

### 1. Extended Token Expiration
```python
# Before: 15 minutes
expire = datetime.utcnow() + timedelta(minutes=15)

# After: 24 hours  
expire = datetime.utcnow() + timedelta(hours=24)
```

### 2. Improved Error Handling
- Added detailed JWT error messages
- Better logging for authentication failures
- More specific error responses

### 3. Removed Duplicate Routes
- Cleaned up duplicate route definitions
- Fixed FastAPI routing conflicts

## If Problem Persists

### Check Browser Console
1. Open Developer Tools > Console
2. Look for any JavaScript errors
3. Check Network tab for failed requests

### Verify Admin Role
1. After login, check if user role is "admin"
2. Only admin users can create menu items
3. Console should show user data after login

### Server Logs
1. Check terminal where backend is running
2. Look for authentication error messages
3. Check for 401 responses in logs

## Emergency Reset
If nothing works:
1. Stop the backend server
2. Clear browser cache completely
3. Restart backend server
4. Use incognito/private browser window
5. Login with admin credentials again
