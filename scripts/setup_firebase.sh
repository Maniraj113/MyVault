#!/bin/bash

# Firebase Storage CORS configuration
echo '{
  "cors": [
    {
      "origin": ["http://localhost:5173", "https://myvault-f3f99.web.app"],
      "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "responseHeader": [
        "Content-Type",
        "Access-Control-Allow-Origin",
        "Cache-Control",
        "Content-Encoding",
        "Content-Length"
      ],
      "maxAgeSeconds": 3600
    }
  ]
}' > cors.json

# Set CORS configuration
echo "Setting CORS configuration for Firebase Storage..."
gsutil cors set cors.json gs://myvault-f3f99.appspot.com

# Clean up
rm cors.json

echo "Firebase Storage CORS configuration complete!"
echo ""
echo "Firebase Storage Pricing Information:"
echo "--------------------------------------"
echo "Free Tier (Spark Plan):"
echo "- 5GB storage"
echo "- 1GB/day download"
echo "- 20K/day upload operations"
echo "- 50K/day download operations"
echo ""
echo "Paid Tier (Blaze Plan) - Pay as you go:"
echo "- Storage: $0.026/GB/month"
echo "- Download: $0.12/GB"
echo "- Upload: $0.05/GB"
echo "- Operations: $0.04/10K operations"
echo ""
echo "For more details visit: https://firebase.google.com/pricing"
