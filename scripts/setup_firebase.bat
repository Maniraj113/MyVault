@echo off
setlocal

REM Create CORS configuration file
echo {> cors.json
echo   "cors": [>> cors.json
echo     {>> cors.json
echo       "origin": ["http://localhost:5173", "https://myvault-f3f99.web.app"],>> cors.json
echo       "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],>> cors.json
echo       "responseHeader": [>> cors.json
echo         "Content-Type",>> cors.json
echo         "Access-Control-Allow-Origin",>> cors.json
echo         "Cache-Control",>> cors.json
echo         "Content-Encoding",>> cors.json
echo         "Content-Length">> cors.json
echo       ],>> cors.json
echo       "maxAgeSeconds": 3600>> cors.json
echo     }>> cors.json
echo   ]>> cors.json
echo }>> cors.json

REM Set CORS configuration
echo Setting CORS configuration for Firebase Storage...
call gsutil cors set cors.json gs://myvault-f3f99.appspot.com

REM Clean up
del cors.json

echo.
echo Firebase Storage CORS configuration complete!
echo.
echo Firebase Storage Pricing Information:
echo --------------------------------------
echo Free Tier (Spark Plan):
echo - 5GB storage
echo - 1GB/day download
echo - 20K/day upload operations
echo - 50K/day download operations
echo.
echo Paid Tier (Blaze Plan) - Pay as you go:
echo - Storage: $0.026/GB/month
echo - Download: $0.12/GB
echo - Upload: $0.05/GB
echo - Operations: $0.04/10K operations
echo.
echo For more details visit: https://firebase.google.com/pricing

pause
