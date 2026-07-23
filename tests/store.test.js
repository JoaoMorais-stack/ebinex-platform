"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { JsonStateStore, cloneInitialState } = require("../src/store");

test("JSON store persists and resets disposable state", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ebinex-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "state.json");
  const store = new JsonStateStore(filePath);
  const state = cloneInitialState();
  state.virtualCash = 12345;
  store.write(state);
  assert.equal(store.read().virtualCash, 12345);
  assert.equal(store.reset().virtualCash, 25000);
  assert.equal(store.read().virtualCash, 25000);
});

test("JSON store falls back safely when local data is malformed", (context) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ebinex-test-"));
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "state.json");
  fs.writeFileSync(filePath, "not-json", "utf8");
  assert.equal(new JsonStateStore(filePath).read().virtualCash, 25000);
});
