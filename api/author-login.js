import {
  isPassValid,
  issueAuthorCookie,
  readJson,
  setNoCache,
} from "./author-utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method Not Allowed");
    return;
  }
  setNoCache(res);
  const body = await readJson(req);
  const pass = typeof body.pass === "string" ? body.pass : "";
  if (!pass || !isPassValid(pass)) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ author: false }));
    return;
  }
  const cookie = issueAuthorCookie();
  if (!cookie) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ author: false, error: "server_misconfigured" }));
    return;
  }
  res.setHeader("Set-Cookie", cookie);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ author: true }));
}
