# setup-local.ps1
# Automates local configuration file setup by copying example configurations to local development configurations.

$backendExample = "$PSScriptRoot\..\BackEnd\src\main\resources\application-local.example.properties"
$backendTarget = "$PSScriptRoot\..\BackEnd\src\main\resources\application-local.properties"

$frontendExample = "$PSScriptRoot\..\FrontEnd\.env.example"
$frontendTarget = "$PSScriptRoot\..\FrontEnd\.env.local"

Write-Host "--- Local Development Setup ---" -ForegroundColor Cyan

# 1. Setup Backend properties
if (-not (Test-Path $backendTarget)) {
    Copy-Item $backendExample $backendTarget
    Write-Host "[+] Copied application-local.example.properties to application-local.properties" -ForegroundColor Green
} else {
    Write-Host "[*] application-local.properties already exists. Skipping copy." -ForegroundColor Yellow
}

# 2. Setup Frontend .env
if (-not (Test-Path $frontendTarget)) {
    Copy-Item $frontendExample $frontendTarget
    Write-Host "[+] Copied .env.example to .env.local" -ForegroundColor Green
} else {
    Write-Host "[*] .env.local already exists. Skipping copy." -ForegroundColor Yellow
}

Write-Host "`nSetup complete! Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit BackEnd/src/main/resources/application-local.properties to set your local MySQL password and secrets."
Write-Host "2. Start the backend with: .\scripts\run-backend-local.ps1"
Write-Host "3. Start the frontend with: cd FrontEnd; npm install; npm run dev`n"
