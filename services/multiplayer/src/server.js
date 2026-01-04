import { randomUUID } from "crypto";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 3001);
const ROOM_ID = "lobby";
const rooms = new Map(); // we still use map, but force everyone into a single room

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      clients: new Map(), // ws -> clientId
      states: new Map(),  // clientId -> state payload
      tiles: new Map(),   // "x,y" -> value
      labels: new Map(),  // "x,y" -> string
    });
  }
  return rooms.get(roomId);
}

function broadcast(roomId, msg, except) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(msg);
  for (const [client] of room.clients) {
    if (client === except || client.readyState !== 1) continue;
    client.send(data);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  let roomId = null;
  const clientId = randomUUID();

  const send = (msg) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(msg));
  };

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch (err) {
      return;
    }

    if (msg.type === "join") {
      // Force everyone into the single lobby; ignore custom room requests.
      roomId = ROOM_ID;
      const room = getRoom(roomId);
      room.clients.set(ws, clientId);

      const players = Array.from(room.states.entries()).map(([id, state]) => ({
        id,
        ...state,
      }));
      const tiles = Array.from(room.tiles.entries()).map(([key, value]) => {
        const [tx, ty] = key.split(",").map(Number);
        return { tx, ty, value };
      });
      const labels = Array.from(room.labels.entries()).map(([key, value]) => {
        const [tx, ty] = key.split(",").map(Number);
        return { tx, ty, label: value };
      });

      send({ type: "welcome", id: clientId, players, tiles, labels });
      broadcast(roomId, { type: "join", id: clientId, name: msg.name }, ws);
      return;
    }

    if (!roomId) return;
    const room = getRoom(roomId);

    if (msg.type === "state" && msg.state) {
      room.states.set(clientId, { ...msg.state, name: msg.name });
      broadcast(roomId, { type: "state", id: clientId, state: msg.state, name: msg.name }, ws);
      return;
    }

    if (msg.type === "tile" && typeof msg.tx === "number" && typeof msg.ty === "number") {
      const key = `${msg.tx},${msg.ty}`;
      room.tiles.set(key, msg.value ?? ".");
      broadcast(roomId, { type: "tile", tx: msg.tx, ty: msg.ty, value: msg.value }, ws);
      return;
    }

    if (msg.type === "edit" && typeof msg.tx === "number" && typeof msg.ty === "number") {
      const key = `${msg.tx},${msg.ty}`;
      if (msg.value !== undefined) room.tiles.set(key, msg.value ?? ".");
      if (msg.label !== undefined) {
        if (msg.label === null || msg.label === "") room.labels.delete(key);
        else room.labels.set(key, String(msg.label));
      }
      broadcast(roomId, { type: "edit", tx: msg.tx, ty: msg.ty, value: msg.value, label: msg.label }, ws);
    }
  });

  const cleanup = () => {
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    room.clients.delete(ws);
    room.states.delete(clientId);
    broadcast(roomId, { type: "leave", id: clientId });
    if (room.clients.size === 0) rooms.delete(roomId);
  };

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

// Periodic sweep to drop closed sockets that did not emit close/error
setInterval(() => {
  for (const [roomId, room] of rooms.entries()) {
    for (const [client, id] of room.clients.entries()) {
      if (client.readyState === 3) {
        room.clients.delete(client);
        room.states.delete(id);
        broadcast(roomId, { type: "leave", id });
      }
    }
    if (room.clients.size === 0) rooms.delete(roomId);
  }
}, 10000);

console.log(`Multiplayer relay listening on ws://localhost:${PORT}`);
