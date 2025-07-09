# AI Service Setup Instructions

## Setting up OpenAI Integration

### 1. Get your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Click "Create new secret key"
4. Copy your API key (it starts with `sk-`)

### 2. Configure Environment Variables
1. Open the `.env` file in the root directory
2. Replace `your_openai_api_key_here` with your actual OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

### 3. Install Dependencies
Navigate to the backend directory and install the required packages:
```bash
cd backend
pip install -r requirements.txt
```

### 4. Test the Setup
Run the test script to verify everything is working:
```bash
python test_ai_service.py
```

If successful, you should see:
- ✓ AI Service initialized successfully
- Sample recommendations and predictions from OpenAI
- 🎉 AI Service is ready for production!

### 5. Integration Notes

The AI service now includes:
- **Real OpenAI API calls** instead of mock data
- **Error handling** for API failures and invalid responses
- **JSON validation** to ensure proper response format
- **Environment variable management** for secure API key storage

### Available AI Functions:
1. `generate_menu_recommendations()` - Personalized menu suggestions
2. `predict_inventory_demand()` - Inventory demand forecasting
3. `optimize_pricing()` - Intelligent price optimization
4. `generate_business_insights()` - Business analytics and insights

### Troubleshooting:
- If you get "OPENAI_API_KEY not found" error, check your `.env` file
- If API calls fail, verify your OpenAI account has sufficient credits
- For JSON parsing errors, the AI will return an error message instead of crashing

### Security Notes:
- Never commit your `.env` file to version control
- The `.env` file is already added to `.gitignore`
- Keep your API key secure and don't share it publicly
