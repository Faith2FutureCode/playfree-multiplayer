import { createHash, createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "pf_author";
const SESSION_SECONDS = 60 * 60 * 12;

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function hashPass(pass) {
  return createHash("sha256").update(pass).digest("hex");
}

function isPassValid(pass) {
  const expectedHash = process.env.AUTHOR_PASSPHRASE_SHA256;
  if (!expectedHash) return false;
  return safeEqual(hashPass(pass), expectedHash);
}

function signToken(expMs) {
  const secret = process.env.AUTHOR_TOKEN_SECRET;
  if (!secret) return null;
  const payload = String(expMs);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

function verifyToken(token) {
  const secret = process.env.AUTHOR_TOKEN_SECRET;
  if (!secret || !token) return { valid: false };
  let decoded = "";
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch (err) {
    return { valid: false };
  }
  const parts = decoded.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;
  if (!payload || !sig) return { valid: false };
  const expectedSig = createHmac("sha256", secret).update(payload).digest("hex");
  if (!safeEqual(sig, expectedSig)) return { valid: false };
  const expMs = Number(payload);
  if (!Number.isFinite(expMs) || Date.now() > expMs) return { valid: false };
  return { valid: true, expMs };
}

function serializeCookie(value, maxAgeSeconds) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Secure",
  ];
  if (Number.isFinite(maxAgeSeconds)) {
    parts.push(`Max-Age=${maxAgeSeconds}`);
  }
  return parts.join("; ");
}

function issueAuthorCookie() {
  const expMs = Date.now() + SESSION_SECONDS * 1000;
  const token = signToken(expMs);
  if (!token) return null;
  return serializeCookie(token, SESSION_SECONDS);
}

function clearAuthorCookie() {
  return serializeCookie("", 0);
}

function parseCookies(req) {
  const header = req.headers?.cookie || "";
  const out = {};
  header.split(";").forEach((part) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const eq = trimmed.indexOf("=");
    if (eq === -1) return;
    const key = trimmed.slice(0, eq);
    const val = trimmed.slice(eq + 1);
    out[key] = decodeURIComponent(val);
  });
  return out;
}

function getAuthorFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return { author: false, clear: false };
  const verified = verifyToken(token);
  return { author: Boolean(verified.valid), clear: !verified.valid };
}

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let raw = "";
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function setNoCache(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
}

export {
  clearAuthorCookie,
  getAuthorFromRequest,
  isPassValid,
  issueAuthorCookie,
  readJson,
  setNoCache,
};
