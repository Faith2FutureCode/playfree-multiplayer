import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  getAuthorFromRequest,
  readJson,
  setNoCache,
} from "./author-utils.js";

const DATA_DIR = join(process.cwd(), "data");
const STORE_PATH = join(DATA_DIR, "boss-layouts.json");

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

async function writeStore(next) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
}

function keyFor(bossId, room) {
  const safeBoss = bossId || "boss";
  const safeRoom = room || "global";
  return `${safeRoom}::${safeBoss}`;
}

export default async function handler(req, res) {
  setNoCache(res);
  if (req.method === "GET") {
    const { bossId = "boss", room = "global" } = req.query || {};
    const store = await readStore();
    const key = keyFor(bossId, room);
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
    const room = body?.room || "global";
    const layout = body?.layout;
    if (!layout || typeof layout !== "object") {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "invalid_layout" }));
      return;
    }
    const store = await readStore();
    const key = keyFor(bossId, room);
    store[key] = layout;
    await writeStore(store);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 405;
  res.setHeader("Allow", "GET, POST");
  res.end("Method Not Allowed");
}
