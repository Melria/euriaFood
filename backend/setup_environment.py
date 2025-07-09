#!/usr/bin/env python3
"""
Interactive setup script for environment configuration
Helps users set up their OpenAI API key and other environment variables securely
"""

import os
import sys
import getpass
import platform
from pathlib import Path

def print_header():
    """Print setup header"""
    print("🔧 Restaurant AI App - Environment Setup")
    print("=" * 50)
    print("This script will help you configure your environment variables securely.")
    print()

def check_existing_config():
    """Check if configuration already exists"""
    env_file = Path('.env')
    has_env_file = env_file.exists()
    has_system_env = bool(os.environ.get('OPENAI_API_KEY'))
    
    print("📋 Current Configuration Status:")
    print(f"   .env file exists: {'✅' if has_env_file else '❌'}")
    print(f"   System OPENAI_API_KEY: {'✅' if has_system_env else '❌'}")
    print()
    
    return has_env_file, has_system_env

def get_openai_key():
    """Get OpenAI API key from user"""
    print("🔑 OpenAI API Key Setup")
    print("You need an OpenAI API key to use the AI features.")
    print("Get one at: https://platform.openai.com/api-keys")
    print()
    
    while True:
        api_key = getpass.getpass("Enter your OpenAI API key (sk-...): ").strip()
        
        if not api_key:
            print("❌ API key cannot be empty")
            continue
            
        if not api_key.startswith('sk-'):
            print("❌ Invalid API key format. Must start with 'sk-'")
            continue
            
        if len(api_key) < 20:
            print("❌ API key seems too short")
            continue
            
        return api_key

def setup_env_file(api_key):
    """Create .env file with configuration"""
    env_content = f"""# OpenAI API Configuration
OPENAI_API_KEY={api_key}

# Database Configuration  
DATABASE_URL=mongodb://localhost:27017
DB_NAME=restaurant_db

# Application Configuration
DEBUG=True
PORT=8001
ENVIRONMENT=development
SECRET_KEY=dev-secret-key-change-in-production-{os.urandom(8).hex()}
"""
    
    env_file = Path('.env')
    
    if env_file.exists():
        response = input("⚠️  .env file already exists. Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            print("❌ Setup cancelled")
            return False
    
    try:
        with open(env_file, 'w') as f:
            f.write(env_content)
        
        print(f"✅ Created .env file at: {env_file.absolute()}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

def setup_system_environment(api_key):
    """Set up system environment variables"""
    system = platform.system().lower()
    
    print(f"\n🔧 Setting up system environment variables for {system}...")
    
    if system == "windows":
        # Windows PowerShell method
        ps_command = f'[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "{api_key}", "User")'
        
        print("\n📋 To set permanently on Windows, run this in PowerShell as Administrator:")
        print(f"   {ps_command}")
        print("\nOr use Command Prompt:")
        print(f'   setx OPENAI_API_KEY "{api_key}"')
        
    else:
        # Linux/Mac
        shell = os.environ.get('SHELL', '/bin/bash')
        config_file = '~/.bashrc' if 'bash' in shell else '~/.zshrc'
        
        print(f"\n📋 To set permanently on {system}, add this to {config_file}:")
        print(f'   export OPENAI_API_KEY="{api_key}"')
        print(f"\nThen run: source {config_file}")
    
    # Set for current session
    os.environ['OPENAI_API_KEY'] = api_key
    print("✅ Set for current session")

def setup_gitignore():
    """Ensure .gitignore includes .env"""
    gitignore_file = Path('.gitignore')
    
    gitignore_content = """
# Environment variables
.env
.env.local
.env.production
*.env

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
venv/
env/

# Logs
logs/
*.log

# Database
*.db
*.sqlite

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
    
    needs_update = True
    
    if gitignore_file.exists():
        with open(gitignore_file, 'r') as f:
            content = f.read()
            if '.env' in content:
                needs_update = False
    
    if needs_update:
        try:
            with open(gitignore_file, 'a') as f:
                f.write(gitignore_content)
            print("✅ Updated .gitignore to exclude .env files")
        except Exception as e:
            print(f"⚠️  Warning: Could not update .gitignore: {e}")

def test_configuration():
    """Test the configuration"""
    print("\n🧪 Testing configuration...")
    
    try:
        from config import get_openai_api_key, validate_environment
        
        # Test API key
        api_key = get_openai_api_key()
        print(f"✅ OpenAI API key loaded: {api_key[:7]}...{api_key[-4:]}")
        
        # Test validation
        validate_environment()
        print("✅ All environment variables validated")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def main():
    """Main setup function"""
    print_header()
    
    # Check current configuration
    has_env_file, has_system_env = check_existing_config()
    
    if has_system_env:
        print("✅ OpenAI API key already configured in system environment")
        if test_configuration():
            print("\n🎉 Setup complete! Your environment is ready.")
            return
    
    # Get setup preference
    print("🔧 Setup Options:")
    print("1. Create .env file (recommended for development)")
    print("2. Set system environment variables (recommended for production)")
    print("3. Both (most secure)")
    print()
    
    while True:
        choice = input("Choose setup method (1/2/3): ").strip()
        if choice in ['1', '2', '3']:
            break
        print("❌ Please enter 1, 2, or 3")
    
    # Get API key
    api_key = get_openai_key()
    
    # Setup based on choice
    success = False
    
    if choice in ['1', '3']:
        success = setup_env_file(api_key)
        setup_gitignore()
    
    if choice in ['2', '3']:
        setup_system_environment(api_key)
        success = True
    
    if success:
        if test_configuration():
            print("\n🎉 Setup complete! Your environment is ready.")
            print("\n📝 Next steps:")
            print("1. Start your application: python server.py")
            print("2. Test AI features in the admin dashboard")
            print("3. Keep your API key secure!")
        else:
            print("\n⚠️  Setup completed but configuration test failed.")
            print("Please check your configuration and try again.")
    else:
        print("\n❌ Setup failed. Please try again.")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
