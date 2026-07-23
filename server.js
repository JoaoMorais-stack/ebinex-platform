"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");
const { JsonStateStore } = require("./src/store");
const { bootstrap, executeTrade, updateSettings, updateWatchlist } = require("./src/simulation");

const LOOPBACK = "127.0.0.1";
const DEFAULT_PORT = 4173;
const BODY_LIMIT = 16 * 1024;
const PUBLIC_ROOT = path.join(__dirname, "public");
const DEFAULT_DATA_FILE = path.join(__dirname, "data", "simulation.json");
const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
});

function securityHeaders(contentType = "application/json; charset=utf-8") {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  };
}

function sendJson(response, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { ...securityHeaders(), "Content-Length": Buffer.byteLength(body), ...extraHeaders });
  response.end(body);
}

function sendError(response, status, message) {
  sendJson(response, status, { error: message });
}

function isLocalAuthority(value) {
  const hostname = String(value || "").toLowerCase().split(":")[0];
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function isAllowedOrigin(value) {
  if (!value) return true;
  try {
    return isLocalAuthority(new URL(value).host);
  } catch {
    return false;
  }
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(request.headers["content-length"] || 0);
    if (declaredLength > BODY_LIMIT) {
      const error = new Error("Request body is too large");
      error.status = 413;
      reject(error);
      request.resume();
      return;
    }
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        const error = new Error("Request body is too large");
        error.status = 413;
        reject(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        const value = text ? JSON.parse(text) : {};
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new SyntaxError();
        resolve(value);
      } catch {
        const error = new Error("Expected a valid JSON object");
        error.status = 400;
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function createRateLimiter({ windowMs = 60_000, maximum = 90 } = {}) {
  const clients = new Map();
  return function check(key, now = Date.now()) {
    const current = clients.get(key);
    if (!current || now - current.startedAt >= windowMs) {
      clients.set(key, { startedAt: now, count: 1 });
      return { allowed: true, remaining: maximum - 1 };
    }
    current.count += 1;
    return { allowed: current.count <= maximum, remaining: Math.max(0, maximum - current.count) };
  };
}

function safePublicPath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  let decoded;
  try {
    decoded = decodeURIComponent(requested);
  } catch {
    return null;
  }
  const normalized = path.normalize(decoded).replace(/^([/\\])+/, "");
  const resolved = path.resolve(PUBLIC_ROOT, normalized);
  return resolved.startsWith(`${PUBLIC_ROOT}${path.sep}`) ? resolved : null;
}

function serveStatic(response, pathname, method) {
  if (method !== "GET" && method !== "HEAD") return false;
  const filePath = safePublicPath(pathname);
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return false;
  const body = fs.readFileSync(filePath);
  const headers = securityHeaders(MIME_TYPES[path.extname(filePath)] || "application/octet-stream");
  headers["Content-Length"] = body.length;
  if (path.extname(filePath) !== ".html") headers["Cache-Control"] = "public, max-age=300";
  response.writeHead(200, headers);
  response.end(method === "HEAD" ? undefined : body);
  return true;
}

function createRequestHandler({ dataFile = DEFAULT_DATA_FILE, now = () => new Date(), rateLimit } = {}) {
  const store = new JsonStateStore(dataFile);
  const limit = rateLimit || createRateLimiter();
  return async function handle(request, response) {
    const clientKey = request.socket.remoteAddress || "local";
    const quota = limit(clientKey);
    if (!quota.allowed) {
      sendError(response, 429, "Too many local requests. Try again shortly.");
      return;
    }
    response.setHeader("X-RateLimit-Remaining", String(quota.remaining));

    if (!isLocalAuthority(request.headers.host)) {
      sendError(response, 403, "Local access only");
      return;
    }
    if (!isAllowedOrigin(request.headers.origin)) {
      sendError(response, 403, "Origin is not allowed");
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const method = request.method || "GET";

    try {
      if (method === "GET" && url.pathname === "/api/health") {
        sendJson(response, 200, { status: "ok", mode: "local-fictional-simulation" });
        return;
      }
      if (method === "GET" && url.pathname === "/api/bootstrap") {
        sendJson(response, 200, bootstrap(store.read()));
        return;
      }
      if (method === "POST" && url.pathname === "/api/trades") {
        const result = executeTrade(store.read(), await readJson(request), now());
        store.write(result.state);
        sendJson(response, 201, { trade: result.trade, portfolio: result.portfolio, history: result.state.history });
        return;
      }
      if (method === "POST" && url.pathname === "/api/watchlist") {
        const state = updateWatchlist(store.read(), await readJson(request));
        store.write(state);
        sendJson(response, 200, { watchlist: state.watchlist });
        return;
      }
      if (method === "PUT" && url.pathname === "/api/settings") {
        const state = updateSettings(store.read(), await readJson(request));
        store.write(state);
        sendJson(response, 200, { settings: state.settings });
        return;
      }
      if (method === "POST" && url.pathname === "/api/reset") {
        sendJson(response, 200, bootstrap(store.reset()));
        return;
      }
      if (url.pathname.startsWith("/api/")) {
        sendError(response, 404, "API route not found");
        return;
      }
      if (serveStatic(response, url.pathname, method)) return;
      sendError(response, 404, "Page not found");
    } catch (error) {
      const status = error.status || (error.code === "VALIDATION_ERROR" ? 422 : 500);
      sendError(response, status, status === 500 ? "Unexpected local server error" : error.message);
    }
  };
}

function startServer({ port = DEFAULT_PORT, dataFile = DEFAULT_DATA_FILE } = {}) {
  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) throw new Error("Port must be between 1 and 65535");
  const server = http.createServer(createRequestHandler({ dataFile }));
  server.listen(parsedPort, LOOPBACK, () => {
    console.log(`Ebinex paper-trading demo: http://${LOOPBACK}:${parsedPort}`);
    console.log("Fictional local simulation only. Press Ctrl+C to stop.");
  });
  return server;
}

if (require.main === module) {
  startServer({ port: process.env.PORT || DEFAULT_PORT });
}

module.exports = { BODY_LIMIT, createRateLimiter, createRequestHandler, isAllowedOrigin, isLocalAuthority, securityHeaders, startServer };
