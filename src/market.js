"use strict";

const MARKETS = Object.freeze([
  { symbol: "BTC", name: "Bitcoin", price: 68420.35, change: 2.84, color: "#f4b740", series: [62, 64, 63, 67, 66, 70, 72, 71, 74, 77, 76, 81] },
  { symbol: "ETH", name: "Ethereum", price: 3584.72, change: 1.62, color: "#7c8cff", series: [48, 51, 50, 54, 52, 56, 59, 58, 61, 63, 65, 67] },
  { symbol: "SOL", name: "Solana", price: 172.44, change: -0.74, color: "#20d6a4", series: [72, 70, 73, 69, 67, 68, 66, 64, 65, 62, 63, 61] },
  { symbol: "ADA", name: "Cardano", price: 0.4521, change: 3.17, color: "#3aa9ff", series: [31, 34, 33, 36, 38, 37, 41, 43, 42, 45, 48, 51] },
  { symbol: "LINK", name: "Chainlink", price: 14.86, change: 0.93, color: "#5470ff", series: [42, 41, 44, 46, 45, 47, 48, 50, 49, 53, 54, 56] },
  { symbol: "AVAX", name: "Avalanche", price: 37.21, change: -1.21, color: "#ef5d61", series: [68, 66, 65, 67, 63, 61, 62, 59, 58, 60, 57, 55] }
]);

const MARKET_MAP = new Map(MARKETS.map((market) => [market.symbol, market]));

function getMarket(symbol) {
  return MARKET_MAP.get(String(symbol || "").toUpperCase()) || null;
}

function publicMarkets() {
  return MARKETS.map((market) => ({ ...market, series: [...market.series] }));
}

module.exports = { MARKETS, getMarket, publicMarkets };
