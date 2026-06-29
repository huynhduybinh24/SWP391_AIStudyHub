# run-backend-local.ps1
# Automates local backend execution by validating config, setting env, building, and running.

$backendTarget = "$PSScriptRoot\..\BackEnd\src\main\resources\application-local.properties"

if (-not (Test-Path $backendTarget)) {
    Write-Host "[!] Error: Local configuration file not found!" -ForegroundColor Red
    Write-Host "Please run the local setup script first by executing:" -ForegroundColor Yellow
    Write-Host ".\scripts\setup-local.ps1`n" -ForegroundColor Cyan
    exit 1
}

# Set APP_ENCRYPTION_SECRET for current session
$env:APP_ENCRYPTION_SECRET="LumiEduLocalDevSecretKey2026!!!!"
Write-Host "[+] Environment variable APP_ENCRYPTION_SECRET set for current session." -ForegroundColor Green

# Go to BackEnd folder
Push-Location "$PSScriptRoot\..\BackEnd"

try {
    # Build package
    Write-Host "[+] Building Backend package..." -ForegroundColor Cyan
    mvn clean package -DskipTests
    
    if ($LASTEXITCODE -ne 0) {
         Write-Host "[!] Build failed!" -ForegroundColor Red
         exit $LASTEXITCODE
    }

    # Run application
    Write-Host "[+] Starting Spring Boot application..." -ForegroundColor Cyan
    java -jar target\lumiedu-0.0.1-SNAPSHOT.jar --server.port=8080 --spring.profiles.active=local
} finally {
    Pop-Location
}
