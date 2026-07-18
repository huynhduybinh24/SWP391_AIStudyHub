# 1. Login to get token
$loginBody = @{
    email = "student@lumiedu.com"
    password = "123456"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.tokens.accessToken
Write-Host "Obtained JWT Token: $token"

# 2. Find a document to report (e.g. check the list of documents first or just use a mock doc ID)
# Let's use documentId = 1 or 2, or fetch shared files first to see what documents exist.
$headers = @{
    Authorization = "Bearer $token"
}

$sharedFiles = Invoke-RestMethod -Uri "http://localhost:8080/api/shared-files" -Method Get -Headers $headers
if ($sharedFiles.Count -gt 0) {
    $docId = $sharedFiles[0].id
    $docName = $sharedFiles[0].name
    Write-Host "Found document to report: ID = $docId, Name = $docName"
} else {
    $docId = 1
    $docName = "Reading"
    Write-Host "No shared files found, defaulting to docId = $docId"
}

# 3. Submit Report
$reportPayload = @{
    documentId = [int]$docId
    reason = "Document violation report"
    details = "Test report submission details from PowerShell"
    reportedFile = $docName
    reporterName = "Huỳnh Duy Bình"
    reporterEmail = "student@lumiedu.com"
} | ConvertTo-Json

Write-Host "Sending report payload: $reportPayload"

try {
    $reportResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/reports" -Method Post -Headers $headers -Body $reportPayload -ContentType "application/json"
    Write-Host "Response received:"
    $reportResponse | ConvertTo-Json
} catch {
    Write-Error $_
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody"
    }
}
