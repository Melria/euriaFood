"""
Environment configuration loader for the AI service
Supports multiple secure methods for API key management
"""
import os
import getpass
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

def get_openai_api_key():
    """
    Get OpenAI API key using multiple secure methods:
    1. System environment variables
    2. .env file
    3. Interactive prompt (development only)
    """
    # Method 1: System environment variables (most secure)
    api_key = os.environ.get('OPENAI_API_KEY')
    if api_key and api_key != 'your_openai_api_key_here':
        logger.info("OpenAI API key loaded from system environment variables")
        return api_key
    
    # Method 2: .env file (development)
    if os.path.exists('.env'):
        load_dotenv(override=True)
        api_key = os.environ.get('OPENAI_API_KEY')
        if api_key and api_key != 'your_openai_api_key_here':
            logger.info("OpenAI API key loaded from .env file")
            return api_key
    
    # Method 3: Interactive prompt (development only)
    if os.environ.get('ENVIRONMENT', 'development') == 'development':
        logger.warning("⚠️  OpenAI API key not found in environment variables or .env file")
        print("\n🔑 OpenAI API Key Required")
        print("You can set it using one of these methods:")
        print("1. System environment: set OPENAI_API_KEY=your-key")
        print("2. .env file: OPENAI_API_KEY=your-key")
        print("3. Enter it now (development only):")
        
        try:
            api_key = getpass.getpass("Enter your OpenAI API key: ").strip()
            if api_key and api_key.startswith('sk-'):
                return api_key
            else:
                logger.error("Invalid OpenAI API key format. Must start with 'sk-'")
        except KeyboardInterrupt:
            logger.error("API key input cancelled by user")
    
    # If we reach here, no valid key was found
    raise ValueError(
        "OPENAI_API_KEY not found. Please set it using one of these methods:\n"
        "1. System environment variable: OPENAI_API_KEY=your-key\n"
        "2. .env file in backend directory\n"
        "3. Windows: setx OPENAI_API_KEY \"your-key\"\n"
        "4. Linux/Mac: export OPENAI_API_KEY=\"your-key\""
    )

def get_database_url():
    """Get database URL with fallback options"""
    db_url = os.environ.get('DATABASE_URL') or os.environ.get('MONGO_URL')
    
    if not db_url:
        db_url = "mongodb://localhost:27017"
        logger.warning(f"Using default database URL: {db_url}")
    
    return db_url

def validate_environment():
    """Validate that all required environment variables are set"""
    required_vars = {
        'OPENAI_API_KEY': get_openai_api_key,
        'DATABASE_URL': get_database_url
    }
    
    missing_vars = []
    
    for var_name, getter_func in required_vars.items():
        try:
            value = getter_func()
            if not value:
                missing_vars.append(var_name)
            else:
                logger.info(f"✓ {var_name} configured successfully")
        except Exception as e:
            logger.error(f"❌ {var_name} configuration failed: {e}")
            missing_vars.append(var_name)
    
    if missing_vars:
        raise ValueError(f"Missing or invalid environment variables: {', '.join(missing_vars)}")
    
    logger.info("✅ All environment variables validated successfully")
    return True

def get_app_config():
    """Get complete application configuration"""
    return {
        'openai_api_key': get_openai_api_key(),
        'database_url': get_database_url(),
        'db_name': os.environ.get('DB_NAME', 'restaurant_db'),
        'secret_key': os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production'),
        'algorithm': os.environ.get('ALGORITHM', 'HS256'),
        'environment': os.environ.get('ENVIRONMENT', 'development'),
        'debug': os.environ.get('DEBUG', 'true').lower() == 'true',
        'port': int(os.environ.get('PORT', 8001)),
        'host': os.environ.get('HOST', '0.0.0.0')
    }
