$loginUrl = "http://localhost:8080/api/auth/login"
$sharedFilesUrl = "http://localhost:8080/api/shared-files"

# 1. Login as User A
$loginBody = @{
    email = "huynhduybinh242k5@gmail.com"
    password = "123456"
} | ConvertTo-Json

Write-Host "Logging in as User A..."
try {
    $loginRes = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.tokens.accessToken
    Write-Host "Login successful! Token: $($token.Substring(0, 15))..."
    
    # 2. Get shared files
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    Write-Host "Fetching shared files for User A..."
    $files = Invoke-RestMethod -Uri $sharedFilesUrl -Method Get -Headers $headers
    
    Write-Host "Fetched $($files.Length) shared files for User A:"
    $files | ForEach-Object {
        Write-Host "  - File ID: $_.id, Name: $_.name, Permission: $_.permission, Owner: $_.owner"
    }
} catch {
    Write-Error $_
}
