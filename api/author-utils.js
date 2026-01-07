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

function normalizeExpectedHash(raw) {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/^sha256:/i, "");
}

function isHexHash(raw) {
  return /^[0-9a-fA-F]{64}$/.test(raw);
}

function toBase64Url(base64) {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function hasPassConfig() {
  return Boolean(process.env.AUTHOR_PASSPHRASE_SHA256);
}
function hasTokenSecret() {
  return Boolean(process.env.AUTHOR_TOKEN_SECRET);
}

function isPassValid(pass) {
  const expectedRaw = process.env.AUTHOR_PASSPHRASE_SHA256;
  if (!expectedRaw) return false;
  const expected = normalizeExpectedHash(expectedRaw);
  const hex = hashPass(pass);
  if (isHexHash(expected) && safeEqual(hex, expected.toLowerCase())) return true;
  const base64 = createHash("sha256").update(pass).digest("base64");
  if (safeEqual(base64, expectedRaw.trim())) return true;
  if (safeEqual(base64, expected)) return true;
  const base64Url = toBase64Url(base64);
  if (safeEqual(base64Url, expectedRaw.trim())) return true;
  if (safeEqual(base64Url, expected)) return true;
  return false;
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
  hasPassConfig,
  hasTokenSecret,
  isPassValid,
  issueAuthorCookie,
  readJson,
  setNoCache,
};
