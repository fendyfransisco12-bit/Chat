#!/bin/bash

# This script configures CORS for Firebase Storage
# You need to have gsutil installed (comes with Google Cloud SDK)

# Get the storage bucket from .env.local
if [ ! -f .env.local ]; then
  echo "Error: .env.local not found"
  exit 1
fi

STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d '=' -f2)

if [ -z "$STORAGE_BUCKET" ]; then
  echo "Error: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not found in .env.local"
  exit 1
fi

echo "Configuring CORS for bucket: $STORAGE_BUCKET"

# Apply CORS configuration
gsutil cors set cors.json "gs://$STORAGE_BUCKET"

if [ $? -eq 0 ]; then
  echo "✓ CORS configuration applied successfully"
else
  echo "✗ Failed to apply CORS configuration"
  echo "Make sure you have gsutil installed and are authenticated"
  echo "See: https://cloud.google.com/storage/docs/configuring-cors"
  exit 1
fi
