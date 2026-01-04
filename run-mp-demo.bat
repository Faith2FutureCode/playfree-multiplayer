@echo off
setlocal

REM If you want the browser tabs to open the deployed domain instead of local,
REM set USE_PLAYFREE=1 before running this script.
if "%USE_PLAYFREE%"=="1" (
  set "BASE=https://playfree.dev/index.html"
  set "MP=mpUrl=wss://ws.playfree.dev&room=test"
) else (
  REM Default to local URLs
  set "BASE=http://localhost:3000/index.html"
  set "MP=mpUrl=ws://localhost:3001&room=test"
)

REM Change to script dir so relative paths work
cd /d "%~dp0"

REM Ensure cloudflared exists (for tunnels)
where cloudflared >NUL 2>NUL
if errorlevel 1 (
  echo cloudflared not found, installing via npm...
  npm install -g cloudflared
)

REM Launch the relay server in a new window (ws://localhost:3001)
start "MP Relay" cmd /k "node services\\multiplayer\\src\\server.js"

REM Launch a simple static server for index.html (http://localhost:3000)
start "HTTP Server" cmd /k "npx http-server . -p 3000"

REM Small delay to let the server start
ping -n 2 127.0.0.1 >nul

REM Start cloudflared tunnels for HTTP and WS
start "Tunnel HTTP 3000" cmd /k "cloudflared tunnel --url http://localhost:3000"
start "Tunnel WS 3001"   cmd /k "cloudflared tunnel --url http://localhost:3001"

REM Build URLs for quick testing (local or deployed depending on USE_PLAYFREE)
set "URL1=%BASE%?%MP%&name=Player1"
set "URL2=%BASE%?%MP%&name=Player2"

REM Open two browser windows/tabs using the default handler
start "Player1" "%URL1%"
start "Player2" "%URL2%"

echo Multiplayer demo launched: server + two clients + cloudflared tunnels.
echo Check the two cloudflared windows for the public URLs.
echo Share link format:
echo   SITE_URL/index.html?mpUrl=WS_URL&room=lobby
echo where:
echo   - SITE_URL is the https://...trycloudflare.com from the 3000 tunnel
echo   - WS_URL is wss://...trycloudflare.com from the 3001 tunnel
endlocal
