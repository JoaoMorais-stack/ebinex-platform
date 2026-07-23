"use strict";

const { getMarket, publicMarkets } = require("./market");

const ALLOWED_CURRENCIES = new Set(["USD", "BRL"]);

function round(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function finiteNumber(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${field} must be between ${min} and ${max}`);
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return parsed;
}

function portfolioSnapshot(state) {
  const positions = publicMarkets()
    .map((market) => {
      const quantity = round(Number(state.holdings[market.symbol] || 0), 8);
      const value = round(quantity * market.price);
      return { ...market, quantity, value };
    })
    .filter((position) => position.quantity > 0);
  const invested = round(positions.reduce((total, position) => total + position.value, 0));
  return {
    virtualCash: round(state.virtualCash),
    invested,
    total: round(state.virtualCash + invested),
    positions
  };
}

function bootstrap(state) {
  return {
    disclosure: "Fictional local paper-trading simulation. No real assets or financial services.",
    profile: { name: "Avery Nova", plan: "Local demo", initials: "AN" },
    markets: publicMarkets(),
    portfolio: portfolioSnapshot(state),
    watchlist: [...state.watchlist],
    history: state.history.slice(0, 50),
    settings: { ...state.settings }
  };
}

function executeTrade(state, input, now = new Date()) {
  const symbol = String(input.symbol || "").trim().toUpperCase();
  const side = String(input.side || "").trim().toUpperCase();
  const market = getMarket(symbol);
  if (!market) throw validationError("Unknown fictional market");
  if (side !== "BUY" && side !== "SELL") throw validationError("Side must be BUY or SELL");
  const quantity = finiteNumber(input.quantity, "quantity", { min: 0.000001, max: 1000000 });
  const total = round(quantity * market.price);
  if (total > 1000000) throw validationError("Virtual order exceeds the demonstration limit");

  const next = JSON.parse(JSON.stringify(state));
  const owned = Number(next.holdings[symbol] || 0);
  if (side === "BUY") {
    if (total > next.virtualCash) throw validationError("Insufficient virtual cash");
    next.virtualCash = round(next.virtualCash - total);
    next.holdings[symbol] = round(owned + quantity, 8);
  } else {
    if (quantity > owned) throw validationError("Insufficient simulated position");
    next.virtualCash = round(next.virtualCash + total);
    next.holdings[symbol] = round(owned - quantity, 8);
  }

  const trade = {
    id: `sim-${now.getTime()}-${next.history.length + 1}`,
    at: now.toISOString(),
    side,
    symbol,
    quantity: round(quantity, 8),
    price: market.price,
    total
  };
  next.history.unshift(trade);
  next.history = next.history.slice(0, 100);
  return { state: next, trade, portfolio: portfolioSnapshot(next) };
}

function updateWatchlist(state, input) {
  const symbol = String(input.symbol || "").trim().toUpperCase();
  if (!getMarket(symbol)) throw validationError("Unknown fictional market");
  const next = JSON.parse(JSON.stringify(state));
  next.watchlist = next.watchlist.includes(symbol)
    ? next.watchlist.filter((item) => item !== symbol)
    : [...next.watchlist, symbol].slice(-6);
  return next;
}

function updateSettings(state, input) {
  const next = JSON.parse(JSON.stringify(state));
  if (Object.hasOwn(input, "displayCurrency")) {
    const currency = String(input.displayCurrency).toUpperCase();
    if (!ALLOWED_CURRENCIES.has(currency)) throw validationError("Unsupported display currency");
    next.settings.displayCurrency = currency;
  }
  for (const field of ["compactMode", "reducedMotion"]) {
    if (Object.hasOwn(input, field)) {
      if (typeof input[field] !== "boolean") throw validationError(`${field} must be boolean`);
      next.settings[field] = input[field];
    }
  }
  return next;
}

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

module.exports = { bootstrap, executeTrade, portfolioSnapshot, updateSettings, updateWatchlist };
