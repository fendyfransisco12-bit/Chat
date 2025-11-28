# Chat Application - Firebase Storage CORS Fix

## Problem
Ketika mencoba upload gambar, mendapat error CORS:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

## Solution - Quick Fix

### Windows PowerShell
```powershell
npm run setup-cors
```

### macOS/Linux Bash
```bash
bash setup-cors.sh
```

## Prerequisites
1. Install Google Cloud SDK:
   - https://cloud.google.com/sdk/docs/install-gcloud-sdk

2. Authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
   
   Ganti `YOUR_PROJECT_ID` dengan project ID dari Firebase Console

## What Gets Configured?
Script akan menerapkan CORS configuration ke Firebase Storage bucket:
- Allows uploads dari `http://localhost:3000`
- Allows GET, HEAD, DELETE, POST, PUT requests
- Sets cache untuk 1 jam

## If Script Fails
Lihat dokumentasi lengkap di: `FIREBASE_STORAGE_CORS_SETUP.md`

Atau configure manual di Firebase Console:
1. Go to: https://console.cloud.google.com
2. Storage > [Your Bucket] > CORS tab
3. Paste JSON dari `cors.json`

## After Configuration
Refresh browser Anda dan coba upload gambar lagi.

Kalau masih error, check browser console (F12) untuk detail error.
