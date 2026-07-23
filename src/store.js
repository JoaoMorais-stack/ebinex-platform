"use strict";

const fs = require("node:fs");
const path = require("node:path");

const INITIAL_STATE = Object.freeze({
  virtualCash: 25000,
  holdings: { BTC: 0.08, ETH: 1.4, SOL: 12, ADA: 2200, LINK: 40, AVAX: 0 },
  watchlist: ["BTC", "ETH", "SOL", "ADA"],
  history: [
    { id: "demo-3", at: "2026-07-20T14:30:00.000Z", side: "BUY", symbol: "SOL", quantity: 4, price: 169.25, total: 677 },
    { id: "demo-2", at: "2026-07-18T10:15:00.000Z", side: "SELL", symbol: "ETH", quantity: 0.35, price: 3512.1, total: 1229.24 },
    { id: "demo-1", at: "2026-07-15T16:45:00.000Z", side: "BUY", symbol: "ADA", quantity: 500, price: 0.4312, total: 215.6 }
  ],
  settings: { displayCurrency: "USD", compactMode: false, reducedMotion: false }
});

function cloneInitialState() {
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isValidState(value) {
  return isPlainObject(value)
    && Number.isFinite(value.virtualCash)
    && isPlainObject(value.holdings)
    && Array.isArray(value.watchlist)
    && Array.isArray(value.history)
    && isPlainObject(value.settings);
}

class JsonStateStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
  }

  read() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      return isValidState(parsed) ? parsed : cloneInitialState();
    } catch (error) {
      if (error.code === "ENOENT" || error instanceof SyntaxError) return cloneInitialState();
      throw error;
    }
  }

  write(state) {
    if (!isValidState(state)) throw new TypeError("Invalid simulation state");
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporaryPath, this.filePath);
  }

  reset() {
    const state = cloneInitialState();
    this.write(state);
    return state;
  }
}

module.exports = { INITIAL_STATE, JsonStateStore, cloneInitialState, isValidState };
