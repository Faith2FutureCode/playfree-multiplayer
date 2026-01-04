# @smb3-service/multiplayer

Lightweight WebSocket relay for the SMB3 web prototype. It keeps simple room state (players + tile mutations) and relays state snapshots between clients.

## Run locally

```bash
node services/multiplayer/src/server.js
```

Environment:
- `PORT` (optional) - defaults to `3001`.

## Protocol (minimal)
- `join` (client -> server): `{type:"join", room, name}`
- `welcome` (server -> client): `{type:"welcome", id, players:[{id,...state}], tiles:[{tx,ty,value}]}`
- `state` (client -> server): `{type:"state", state:{x,y,vx,vy,facing,big,state,coins,timer}, name}`
- `state` (server -> clients): `{type:"state", id, state, name}`
- `tile` (client/server): `{type:"tile", tx, ty, value}`
- `leave` (server -> clients): `{type:"leave", id}`
