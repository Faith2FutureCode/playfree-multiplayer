import { clearAuthorCookie, setNoCache } from "./author-utils.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }
  setNoCache(res);
  res.setHeader("Set-Cookie", clearAuthorCookie());
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ author: false }));
}
