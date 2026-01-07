import { hasPassConfig, hasTokenSecret, setNoCache } from "./author-utils.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.end("Method Not Allowed");
    return;
  }
  setNoCache(res);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    hasPassphraseHash: hasPassConfig(),
    hasTokenSecret: hasTokenSecret(),
  }));
}
