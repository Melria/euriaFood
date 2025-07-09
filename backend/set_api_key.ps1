# OpenAI API Key Setup Script for PowerShell
Write-Host "🔑 OpenAI API Key Setup for PowerShell" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

do {
    $apiKey = Read-Host "Enter your OpenAI API key (sk-...)"
    
    if ([string]::IsNullOrWhiteSpace($apiKey)) {
        Write-Host "❌ API key cannot be empty" -ForegroundColor Red
        continue
    }
    
    if (-not $apiKey.StartsWith("sk-")) {
        Write-Host "❌ Invalid API key format. Must start with 'sk-'" -ForegroundColor Red
        continue
    }
    
    if ($apiKey.Length -lt 20) {
        Write-Host "❌ API key seems too short" -ForegroundColor Red
        continue
    }
    
    break
} while ($true)

Write-Host ""
Write-Host "Setting environment variable..." -ForegroundColor Yellow

try {
    # Set for current session
    $env:OPENAI_API_KEY = $apiKey
    
    # Set permanently for user
    [Environment]::SetEnvironmentVariable("OPENAI_API_KEY", $apiKey, "User")
    
    Write-Host "✅ OpenAI API key set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Current session: Ready" -ForegroundColor Green
    Write-Host "✅ Future sessions: Ready" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start your backend server." -ForegroundColor Cyan
    
    # Verify the setting
    $verifyKey = [Environment]::GetEnvironmentVariable("OPENAI_API_KEY", "User")
    if ($verifyKey -eq $apiKey) {
        Write-Host "✅ Verification: Environment variable set correctly" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Failed to set environment variable: $_" -ForegroundColor Red
    Write-Host "Try running PowerShell as administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
