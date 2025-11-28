# This script configures CORS for Firebase Storage on Windows
# You need to have gsutil installed (comes with Google Cloud SDK)

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "Error: .env.local not found" -ForegroundColor Red
    exit 1
}

# Read storage bucket from .env.local
$envContent = Get-Content ".env.local"
$storageBucket = $envContent | Where-Object { $_ -match "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" } | ForEach-Object { $_.Split('=')[1] }

if ([string]::IsNullOrWhiteSpace($storageBucket)) {
    Write-Host "Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env.local" -ForegroundColor Red
    exit 1
}

Write-Host "Configuring CORS for bucket: $storageBucket" -ForegroundColor Yellow

# Apply CORS configuration
gsutil cors set cors.json "gs://$storageBucket"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ CORS configuration applied successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to apply CORS configuration" -ForegroundColor Red
    Write-Host "Make sure you have gsutil installed and are authenticated" -ForegroundColor Yellow
    Write-Host "See: https://cloud.google.com/storage/docs/configuring-cors" -ForegroundColor Blue
    exit 1
}
