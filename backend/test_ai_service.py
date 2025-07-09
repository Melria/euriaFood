"""
Test script for AI Service integration with OpenAI
Run this to verify your OpenAI API key is working correctly
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_service import AIService

async def test_ai_service():
    """Test the AI service with sample data"""
    print("Testing AI Service with OpenAI API...")
    
    try:
        # Initialize AI service
        ai = AIService()
        print("✓ AI Service initialized successfully")
        
        # Test menu recommendations
        print("\n--- Testing Menu Recommendations ---")
        sample_order_history = [
            {"item": "Burger Classic", "date": "2025-01-01", "price": 12.90},
            {"item": "Frites", "date": "2025-01-01", "price": 4.50},
            {"item": "Salade César", "date": "2025-01-05", "price": 9.90}
        ]
        
        recommendations = await ai.generate_menu_recommendations(
            user_id="test_user",
            order_history=sample_order_history,
            preferences={"dietary": "none", "price_range": "medium"}
        )
        
        print("Recommendations received:")
        print(recommendations)
        
        # Test inventory demand prediction
        print("\n--- Testing Inventory Demand Prediction ---")
        sample_historical_data = [
            {"item": "Burger Classic", "date": "2025-01-01", "quantity": 25},
            {"item": "Burger Classic", "date": "2025-01-02", "quantity": 30},
            {"item": "Salade César", "date": "2025-01-01", "quantity": 15},
            {"item": "Salade César", "date": "2025-01-02", "quantity": 18}
        ]
        
        predictions = await ai.predict_inventory_demand(
            historical_data=sample_historical_data,
            days_ahead=7
        )
        
        print("Inventory predictions received:")
        print(predictions)
        
        print("\n✓ All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False
    
    return True

if __name__ == "__main__":
    # Run the test
    success = asyncio.run(test_ai_service())
    if success:
        print("\n🎉 AI Service is ready for production!")
    else:
        print("\n⚠️ Please check your configuration and try again.")
