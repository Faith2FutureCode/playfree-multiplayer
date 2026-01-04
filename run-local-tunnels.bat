@echo off
setlocal

rem Simple helper to host the site locally and expose HTTP + WS via cloudflared tunnels.
rem Requirements: Node.js; cloudflared (this script will install via npm if missing).

where cloudflared >NUL 2>NUL
if errorlevel 1 (
  echo cloudflared not found, installing via npm...
  npm install -g cloudflared
)

echo Starting local HTTP server on port 3000...
start "playfree-http" cmd /k "npx http-server . -p 3000"

echo Starting local multiplayer relay on port 3001...
start "playfree-ws" cmd /k "node services\\multiplayer\\src\\server.js"

echo Starting cloudflared tunnel for HTTP (3000)...
start "playfree-tunnel-http" cmd /k "cloudflared tunnel --url http://localhost:3000"

echo Starting cloudflared tunnel for WebSocket (3001)...
start "playfree-tunnel-ws" cmd /k "cloudflared tunnel --url http://localhost:3001"

echo.
echo Watch the two cloudflared windows for the URLs (https://*.trycloudflare.com).
echo Use them like:
echo   SITE_URL/index.html?mpUrl=WS_URL&room=lobby
echo Replace SITE_URL with the 3000 tunnel and WS_URL (as wss://) with the 3001 tunnel.
echo.
pause

endlocal
