#!/usr/bin/env python3
"""
Module Import Test Script
Tests all imports used in the backend to identify missing modules.
"""

import sys
import importlib
import traceback

# List of all third-party modules used in the backend based on code analysis
REQUIRED_MODULES = [
    # Core Framework
    'fastapi',
    'uvicorn',
    'starlette',
    
    # Database
    'motor',
    'pymongo',
    
    # Authentication & Security
    'jwt',
    'passlib',
    'bcrypt',
    'cryptography',
    
    # Environment & Configuration
    'dotenv',
    'pydantic',
    
    # Data Processing
    'pandas',
    'numpy',
    
    # HTTP & API
    'requests',
    'aiofiles',
    
    # AI & Machine Learning
    'openai',
    'scikit-learn',
    
    # Payment Processing
    'stripe',
    
    # PDF & Reports
    'reportlab',
    
    # Development & Testing
    'pytest',
    'black',
    'isort',
    'flake8',
    'mypy',
    
    # Additional utilities
    'boto3',
]

# Specific submodules that need to be tested
SPECIFIC_IMPORTS = [
    ('fastapi', 'FastAPI'),
    ('fastapi', 'APIRouter'),
    ('fastapi', 'HTTPException'),
    ('fastapi', 'Depends'),
    ('fastapi', 'status'),
    ('fastapi.security', 'HTTPBearer'),
    ('fastapi.security', 'HTTPAuthorizationCredentials'),
    ('fastapi.responses', 'Response'),
    ('starlette.middleware.cors', 'CORSMiddleware'),
    ('motor.motor_asyncio', 'AsyncIOMotorClient'),
    ('pydantic', 'BaseModel'),
    ('pydantic', 'Field'),
    ('passlib.context', 'CryptContext'),
    ('reportlab.lib.pagesizes', 'letter'),
    ('reportlab.lib.pagesizes', 'A4'),
    ('reportlab.platypus', 'SimpleDocTemplate'),
    ('reportlab.platypus', 'Table'),
    ('reportlab.platypus', 'TableStyle'),
    ('reportlab.platypus', 'Paragraph'),
    ('reportlab.platypus', 'Spacer'),
    ('reportlab.lib.styles', 'getSampleStyleSheet'),
    ('reportlab.lib.styles', 'ParagraphStyle'),
    ('reportlab.lib', 'colors'),
    ('reportlab.lib.units', 'inch'),
    ('dotenv', 'load_dotenv'),
]

def test_module_import(module_name):
    """Test if a module can be imported."""
    try:
        importlib.import_module(module_name)
        return True, None
    except ImportError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def test_specific_import(module_name, item_name):
    """Test if a specific item can be imported from a module."""
    try:
        module = importlib.import_module(module_name)
        getattr(module, item_name)
        return True, None
    except ImportError as e:
        return False, str(e)
    except AttributeError as e:
        return False, f"AttributeError: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

def main():
    print("=" * 70)
    print("MODULE IMPORT TEST - RESTAURANT MANAGEMENT APP BACKEND")
    print("=" * 70)
    print()
    
    missing_modules = []
    failed_imports = []
    
    print("Testing basic module imports...")
    print("-" * 40)
    
    for module in REQUIRED_MODULES:
        success, error = test_module_import(module)
        if success:
            print(f"✅ {module}")
        else:
            print(f"❌ {module} - {error}")
            missing_modules.append((module, error))
    
    print()
    print("Testing specific imports...")
    print("-" * 40)
    
    for module_name, item_name in SPECIFIC_IMPORTS:
        success, error = test_specific_import(module_name, item_name)
        if success:
            print(f"✅ from {module_name} import {item_name}")
        else:
            print(f"❌ from {module_name} import {item_name} - {error}")
            failed_imports.append((module_name, item_name, error))
    
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    if not missing_modules and not failed_imports:
        print("🎉 ALL MODULES AND IMPORTS ARE AVAILABLE!")
        print("Your backend should start without import errors.")
    else:
        if missing_modules:
            print(f"❌ {len(missing_modules)} MISSING MODULES:")
            for module, error in missing_modules:
                print(f"   - {module}: {error}")
        
        if failed_imports:
            print(f"❌ {len(failed_imports)} FAILED IMPORTS:")
            for module, item, error in failed_imports:
                print(f"   - from {module} import {item}: {error}")
        
        print()
        print("INSTALLATION COMMANDS:")
        print("-" * 30)
        
        # Extract base module names for installation
        modules_to_install = set()
        for module, _ in missing_modules:
            # Map some module names to their pip package names
            if module == 'jwt':
                modules_to_install.add('PyJWT')
            elif module == 'dotenv':
                modules_to_install.add('python-dotenv')
            elif module == 'sklearn':
                modules_to_install.add('scikit-learn')
            else:
                modules_to_install.add(module)
        
        for module, item, _ in failed_imports:
            if module == 'jwt':
                modules_to_install.add('PyJWT')
            elif module == 'dotenv':
                modules_to_install.add('python-dotenv')
            elif 'sklearn' in module:
                modules_to_install.add('scikit-learn')
            else:
                modules_to_install.add(module.split('.')[0])
        
        if modules_to_install:
            install_cmd = 'pip install ' + ' '.join(sorted(modules_to_install))
            print(f"Run: {install_cmd}")
    
    print()
    return len(missing_modules) + len(failed_imports)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
