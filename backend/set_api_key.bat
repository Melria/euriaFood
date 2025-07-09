@echo off
echo 🔑 OpenAI API Key Setup for Windows
echo =====================================
echo.
echo This script will help you set your OpenAI API key as an environment variable.
echo.

:input
set /p OPENAI_KEY="Enter your OpenAI API key (sk-...): "

if "%OPENAI_KEY%"=="" (
    echo ❌ API key cannot be empty
    goto input
)

if not "%OPENAI_KEY:~0,3%"=="sk-" (
    echo ❌ Invalid API key format. Must start with 'sk-'
    goto input
)

echo.
echo Setting environment variable...

REM Set for current session
set OPENAI_API_KEY=%OPENAI_KEY%

REM Set permanently for user
setx OPENAI_API_KEY "%OPENAI_KEY%" > nul

if %errorlevel% equ 0 (
    echo ✅ OpenAI API key set successfully!
    echo.
    echo ✅ Current session: Ready
    echo ✅ Future sessions: Ready
    echo.
    echo You can now start your backend server.
    echo.
    pause
) else (
    echo ❌ Failed to set environment variable
    echo Try running as administrator or set manually:
    echo setx OPENAI_API_KEY "%OPENAI_KEY%"
    echo.
    pause
)
