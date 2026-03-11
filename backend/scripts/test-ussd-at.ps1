param(
  [string]$BaseUrl = "http://localhost:3000",
  [string]$SessionId = "local-session-1",
  [string]$ServiceCode = "*123#",
  [string]$PhoneNumber = "+258841234567",
  [string]$Text = ""
)

$uri = "$BaseUrl/api/ussd"
$body = @{
  sessionId = $SessionId
  serviceCode = $ServiceCode
  phoneNumber = $PhoneNumber
  text = $Text
}

Write-Host "POST $uri" -ForegroundColor Cyan
Write-Host ("Payload: " + ($body | ConvertTo-Json -Compress)) -ForegroundColor DarkGray

try {
  $response = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
  Write-Host ("Status: " + [int]$response.StatusCode) -ForegroundColor Green
  Write-Host "Response:" -ForegroundColor Yellow
  Write-Host $response.Content
} catch {
  Write-Host "Falha ao testar callback USSD." -ForegroundColor Red
  if ($_.Exception.Response) {
    Write-Host ("Status: " + [int]$_.Exception.Response.StatusCode) -ForegroundColor Red
  }
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}
