# Firebase Storage CORS Configuration Guide

## Problem

Kamu mendapat error CORS (Cross-Origin Resource Sharing) saat upload gambar:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy
```

Ini terjadi karena Firebase Storage belum dikonfigurasi untuk menerima request dari localhost:3000 (atau domain lainnya).

## Solution

Ada dua cara untuk mengkonfigurasi CORS:

### Cara 1: Menggunakan gsutil (Recommended - Otomatis)

#### Prerequisites:
1. Install Google Cloud SDK
   - Windows: https://cloud.google.com/sdk/docs/install-gcloud-sdk
   - macOS: `brew install --cask google-cloud-sdk`
   - Linux: https://cloud.google.com/sdk/docs/install-gcloud-sdk

2. Authenticate dengan akun Google Cloud:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
   
   (Replace `YOUR_PROJECT_ID` dengan project ID dari Firebase Console)

3. Run script di direktori project:
   ```powershell
   # Windows
   .\setup-cors.ps1
   
   # macOS/Linux
   bash setup-cors.sh
   ```

### Cara 2: Manual Setup di Google Cloud Console

1. Buka Google Cloud Console: https://console.cloud.google.com

2. Pilih project Firebase Anda

3. Pergi ke Storage → Browser

4. Pilih bucket Firebase Storage

5. Klik tab "CORS"

6. Klik "Edit CORS configuration"

7. Paste JSON configuration berikut:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001"],
       "method": ["GET", "HEAD", "DELETE", "POST", "PUT"],
       "responseHeader": ["Content-Type", "Authorization"],
       "maxAgeSeconds": 3600
     },
     {
       "origin": ["https://yourdomain.com"],
       "method": ["GET", "HEAD", "DELETE", "POST", "PUT"],
       "responseHeader": ["Content-Type", "Authorization"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   
   Sesuaikan `origin` dengan domain Anda:
   - Untuk development: `http://localhost:3000`
   - Untuk production: `https://yourdomain.com`

8. Klik "Save"

### Cara 3: Menggunakan gsutil Command Langsung

```bash
# Login ke gcloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Set CORS
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
```

Replace `YOUR_STORAGE_BUCKET` dengan bucket name dari Firebase Console.

## Verify Configuration

Untuk memverifikasi CORS sudah dikonfigurasi:

```bash
gsutil cors get gs://YOUR_STORAGE_BUCKET
```

Seharusnya output JSON dengan configuration yang sudah di-set.

## Troubleshooting

### "Permission denied" error
- Pastikan Anda sudah login dengan `gcloud auth login`
- Pastikan akun memiliki akses ke project Firebase
- Cek di Firebase Console > Project Settings > Members

### gsutil command not found
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install-gcloud-sdk
- Setelah install, restart terminal/PowerShell

### Still getting CORS error
- Refresh browser dan clear cache (Ctrl+Shift+Delete)
- CORS changes bisa butuh beberapa menit untuk take effect
- Cek console browser (F12) untuk exact error message

## Production Deployment

Untuk production, pastikan menambahkan domain production Anda ke CORS configuration:

```json
{
  "origin": ["https://yourdomain.com", "https://www.yourdomain.com"],
  "method": ["GET", "HEAD", "DELETE", "POST", "PUT"],
  "responseHeader": ["Content-Type", "Authorization"],
  "maxAgeSeconds": 3600
}
```

## References

- Firebase Storage Setup: https://firebase.google.com/docs/storage/web/start
- CORS Configuration: https://cloud.google.com/storage/docs/configuring-cors
- gsutil Documentation: https://cloud.google.com/storage/docs/gsutil
