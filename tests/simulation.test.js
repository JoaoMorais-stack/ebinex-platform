"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cloneInitialState } = require("../src/store");
const { bootstrap, executeTrade, updateSettings, updateWatchlist } = require("../src/simulation");

test("bootstrap exposes only fictional portfolio data", () => {
  const result = bootstrap(cloneInitialState());
  assert.match(result.disclosure, /fictional/i);
  assert.equal(result.profile.name, "Avery Nova");
  assert.equal(result.markets.length, 6);
  assert.ok(result.portfolio.total > result.portfolio.virtualCash);
});

test("virtual buy changes only simulated cash and holdings", () => {
  const initial = cloneInitialState();
  const result = executeTrade(initial, { symbol: "BTC", side: "BUY", quantity: 0.01 }, new Date("2026-07-22T12:00:00Z"));
  assert.equal(initial.holdings.BTC, 0.08);
  assert.equal(result.state.holdings.BTC, 0.09);
  assert.equal(result.trade.id, "sim-1784721600000-4");
  assert.equal(result.state.history[0].side, "BUY");
  assert.ok(result.state.virtualCash < initial.virtualCash);
});

test("virtual sell is rejected when the position is insufficient", () => {
  assert.throws(
    () => executeTrade(cloneInitialState(), { symbol: "ETH", side: "SELL", quantity: 50 }),
    /Insufficient simulated position/
  );
});

test("unknown markets and excessive orders are rejected", () => {
  assert.throws(() => executeTrade(cloneInitialState(), { symbol: "REAL", side: "BUY", quantity: 1 }), /Unknown fictional market/);
  assert.throws(() => executeTrade(cloneInitialState(), { symbol: "BTC", side: "BUY", quantity: 100 }), /demonstration limit/);
});

test("watchlist toggles known markets and settings accept strict values", () => {
  const withoutBtc = updateWatchlist(cloneInitialState(), { symbol: "BTC" });
  assert.equal(withoutBtc.watchlist.includes("BTC"), false);
  const settings = updateSettings(withoutBtc, { displayCurrency: "BRL", compactMode: true });
  assert.deepEqual(settings.settings, { displayCurrency: "BRL", compactMode: true, reducedMotion: false });
  assert.throws(() => updateSettings(settings, { displayCurrency: "EUR" }), /Unsupported/);
});
