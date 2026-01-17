import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import {
  getAuthorFromRequest,
  readJson,
  setNoCache,
} from "./author-utils.js";

const STORE_PATHS = [
  join(process.cwd(), "data", "boss-layouts.json"),
  join(tmpdir(), "boss-layouts.json"),
];
const DEFAULT_ROOM = "global";

async function readStore() {
  for (const path of STORE_PATHS) {
    try {
      const raw = await readFile(path, "utf8");
      return { data: JSON.parse(raw), path };
    } catch (err) {
      // try next candidate
    }
  }
  return { data: {}, path: STORE_PATHS[0] };
}

async function writeStore(next) {
  let lastErr = null;
  for (const path of STORE_PATHS) {
    try {
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, JSON.stringify(next, null, 2), "utf8");
      return path;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("failed_to_write_store");
}

function keyFor(bossId, room) {
  const safeBoss = bossId || "boss";
  const safeRoom = DEFAULT_ROOM;
  return `${safeRoom}::${safeBoss}`;
}

export default async function handler(req, res) {
  setNoCache(res);
  if (req.method === "GET") {
    const { bossId = "boss" } = req.query || {};
    const { data: store } = await readStore();
    const key = keyFor(bossId, DEFAULT_ROOM);
    const layout = store[key] || {};
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ layout }));
    return;
  }

  if (req.method === "POST") {
    const { author } = getAuthorFromRequest(req);
    if (!author) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "author_required" }));
      return;
    }
    const body = await readJson(req);
    const bossId = body?.bossId || "boss";
    const room = DEFAULT_ROOM;
    const layout = body?.layout;
    if (!layout || typeof layout !== "object") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "invalid_layout" }));
      return;
    }
    try {
      const { data: store } = await readStore();
      const key = keyFor(bossId, room);
      store[key] = layout;
      await writeStore(store);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true }));
      return;
    } catch (err) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "persist_failed" }));
      return;
    }
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end("Method Not Allowed");
}
