#!/usr/bin/env python3
"""
Quick startup test for the Restaurant IA backend
"""

if __name__ == "__main__":
    print("🚀 Starting Restaurant IA Backend Server...")
    
    try:
        # Test all imports first
        print("📦 Testing imports...")
        from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
        from report_service import report_service
        from models import Payment, Review, FavoriteOrder, Notification
        from ai_service import ai_service
        print("✅ All imports successful!")
        
        # Import the main server
        print("🔧 Loading server configuration...")
        import server
        print("✅ Server configuration loaded!")
        
        print("🎯 Server is ready!")
        print("📋 Available endpoints:")
        print("   - POST /api/reports/generate?period=today")
        print("   - GET  /api/orders")
        print("   - GET  /api/stats/dashboard")
        print("   - And many more...")
        print("")
        print("🌟 The 'Query' import issue has been fixed!")
        print("🔗 You can now start the server with uvicorn:")
        print("   uvicorn server:app --host 0.0.0.0 --port 8001 --reload")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print("🔧 Please check the error and fix any remaining issues.")
