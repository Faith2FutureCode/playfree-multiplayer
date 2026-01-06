import {
  clearAuthorCookie,
  getAuthorFromRequest,
  setNoCache,
} from "./author-utils.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }
  setNoCache(res);
  const { author, clear } = getAuthorFromRequest(req);
  if (clear) res.setHeader("Set-Cookie", clearAuthorCookie());
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ author: Boolean(author) }));
}
