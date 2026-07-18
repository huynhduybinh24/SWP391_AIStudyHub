$smtpHost = "smtp.gmail.com"
$smtpPort = 587
$username = "lumieduteam@gmail.com"
$appPassword = "xagzjgkcipyihtpw"

Write-Host "Testing Gmail SMTP with App Password..." -ForegroundColor Cyan
Write-Host "Account: $username"
Write-Host "App Password: $appPassword"
Write-Host ""

try {
    $smtp = New-Object Net.Mail.SmtpClient($smtpHost, $smtpPort)
    $smtp.EnableSsl = $true
    $smtp.Credentials = New-Object System.Net.NetworkCredential($username, $appPassword)

    $msg = New-Object Net.Mail.MailMessage
    $msg.From = $username
    $msg.To.Add($username)
    $msg.Subject = "[LumiEdu TEST] SMTP Check OK"
    $msg.Body = "App Password dang hoat dong chinh xac! SMTP connect thanh cong."

    $smtp.Send($msg)
    Write-Host "SUCCESS: Email gui thanh cong! App Password hop le." -ForegroundColor Green
    Write-Host "Kiem tra hop thu den cua $username de xac nhan." -ForegroundColor Yellow
}
catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Co the do:" -ForegroundColor Yellow
    Write-Host "  1. App Password sai/het han - vao myaccount.google.com/apppasswords de tao moi"
    Write-Host "  2. 2-Step Verification chua bat - vao account.google.com/security"
    Write-Host "  3. 'Less secure app access' bi tat (khong dung voi App Password)"
}
