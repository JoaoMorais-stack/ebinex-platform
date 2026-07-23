"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { createRequestHandler } = require("../server");

async function withServer(context) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ebinex-web-test-"));
  const dataFile = path.join(directory, "state.json");
  const server = http.createServer(createRequestHandler({
    dataFile,
    now: () => new Date("2026-07-22T12:00:00Z")
  }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

test("local server serves the interface with security headers", async (context) => {
  const base = await withServer(context);
  const response = await fetch(`${base}/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(html, /Paper Trading Lab/);
});

test("bootstrap and virtual trade API complete a local workflow", async (context) => {
  const base = await withServer(context);
  const initialResponse = await fetch(`${base}/api/bootstrap`);
  const initial = await initialResponse.json();
  const tradeResponse = await fetch(`${base}/api/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "ETH", side: "BUY", quantity: 0.1 })
  });
  const result = await tradeResponse.json();
  assert.equal(tradeResponse.status, 201);
  assert.equal(result.trade.symbol, "ETH");
  assert.ok(result.portfolio.virtualCash < initial.portfolio.virtualCash);
});

test("server rejects non-local origins and invalid input", async (context) => {
  const base = await withServer(context);
  const originResponse = await fetch(`${base}/api/bootstrap`, { headers: { Origin: "https://example.invalid" } });
  assert.equal(originResponse.status, 403);
  const invalidResponse = await fetch(`${base}/api/trades`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol: "BTC", side: "BUY", quantity: -2 })
  });
  assert.equal(invalidResponse.status, 422);
});

test("rate limiter blocks excess local requests", async (context) => {
  const base = await withServer(context);
  const rateLimit = (key) => ({ allowed: false, remaining: 0 });
  const server = http.createServer(createRequestHandler({ dataFile: path.join(os.tmpdir(), "unused-ebinex.json"), rateLimit }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
  assert.equal(response.status, 429);
  assert.equal(base.startsWith("http://127.0.0.1:"), true);
});
