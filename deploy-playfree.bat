@echo off
setlocal

echo.
echo === Playfree.dev deploy helper ===
echo.
echo This script assumes:
echo   - You have Node.js and pnpm installed
echo   - You are logged in with Vercel CLI (run "vercel login" once)
echo   - You have a Render account and will create the Web Service in the UI
echo.
pause

REM Install Vercel CLI if missing
where vercel >NUL 2>NUL
if errorlevel 1 (
  echo Installing Vercel CLI globally...
  npm install -g vercel
)

echo.
echo === Deploy static site to Vercel ===
echo This will deploy the root (serves index.html).
echo Accept defaults; pick "Other" as framework when asked.
pause
vercel

echo.
echo Add domain to Vercel: playfree.dev
vercel domains add playfree.dev

echo.
echo === DNS setup reminder ===
echo In your registrar DNS:
echo   - Set root playfree.dev to the Vercel target shown above (CNAME cname.vercel-dns.com or A/AAAA IPs Vercel provides).
echo.
pause

echo.
echo === Deploy multiplayer relay to Render (manual, UI steps) ===
echo 1) In Render: New -> Web Service -> connect this repo.
echo 2) Root directory: services/multiplayer
echo 3) Build command: npm install
echo 4) Start command: node src/server.js
echo 5) Leave PORT empty so Render uses its injected port.
echo 6) Deploy; copy the hostname like multiplayer-xxx.onrender.com
echo.
pause

set /p RENDER_HOST=Enter Render host (e.g. multiplayer-xxx.onrender.com):
if "%RENDER_HOST%"=="" (
  echo Skipping ws DNS step (no host provided).
) else (
  echo.
  echo Add DNS CNAME in registrar:
  echo   ws.playfree.dev -> %RENDER_HOST%
)

echo.
echo === Local test option ===
echo To run relay locally: node services\\multiplayer\\src\\server.js
echo Then open: index.html?mpUrl=ws://localhost:3001
echo.
echo Done. DNS may take 10-60 minutes to propagate.
pause

endlocal
