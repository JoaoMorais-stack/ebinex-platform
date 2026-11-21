"use strict";

const root = document.querySelector("#view-root");
const toast = document.querySelector("#toast");
const searchInput = document.querySelector("#market-search");
const dialog = document.querySelector("#confirm-dialog");

const app = {
  data: null,
  view: "dashboard",
  activeSymbol: "BTC",
  tradeSide: "BUY",
  search: "",
  busy: false
};

const DEMO_BRL_RATE = 5.4;

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...(options.headers || {}) } : options.headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Local request failed");
  return payload;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(value, maximumFractionDigits = 2) {
  const currency = app.data?.settings.displayCurrency || "USD";
  const amount = currency === "BRL" ? value * DEMO_BRL_RATE : value;
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits
  }).format(amount);
}

function formatNumber(value, digits = 6) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function market(symbol) {
  return app.data.markets.find((item) => item.symbol === symbol) || app.data.markets[0];
}

function showToast(message, type = "success") {
  toast.textContent = message;
  toast.className = `toast show ${type === "error" ? "error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.className = "toast"; }, 3200);
}

function pageHead(eyebrow, title, description, actions = "") {
  return `
    <header class="page-head">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
      </div>
      ${actions ? `<div class="actions">${actions}</div>` : ""}
    </header>`;
}

function assetCell(item) {
  return `<div class="asset"><span class="asset-badge" data-style="--asset-color:${item.color}">${escapeHtml(item.symbol)}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.symbol)}</small></div></div>`;
}

function marketRows(markets = app.data.markets) {
  return markets.map((item) => {
    const tracked = app.data.watchlist.includes(item.symbol);
    return `<tr>
      <td>${assetCell(item)}</td>
      <td>${displayValue(item.price, item.price < 1 ? 4 : 2)}</td>
      <td class="${item.change >= 0 ? "positive" : "negative"}">${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)}%</td>
      <td>${displayValue(item.price * 0.982)}</td>
      <td>${displayValue(item.price * 1.018)}</td>
      <td><button class="star-button ${tracked ? "active" : ""}" type="button" data-watch="${item.symbol}" aria-label="${tracked ? "Remove from" : "Add to"} watchlist">&#9733;</button></td>
    </tr>`;
  }).join("");
}

function activityList(limit = app.data.history.length) {
  if (!app.data.history.length) return `<div class="empty">No simulated activity yet.</div>`;
  return `<div class="activity-list">${app.data.history.slice(0, limit).map((trade) => `
    <div class="activity-item">
      <span class="activity-side ${trade.side === "SELL" ? "sell" : ""}">${trade.side}</span>
      <div><strong>${escapeHtml(trade.symbol)} ${formatNumber(trade.quantity)}</strong><small>${formatDate(trade.at)} at ${displayValue(trade.price, trade.price < 1 ? 4 : 2)}</small></div>
      <strong class="activity-total">${displayValue(trade.total)}</strong>
    </div>`).join("")}</div>`;
}

function allocationList() {
  const total = app.data.portfolio.invested || 1;
  return `<div class="allocation-list">${app.data.portfolio.positions.map((position) => {
    const percentage = Math.max(0, Math.min(100, (position.value / total) * 100));
    return `<div class="allocation-row"><span>${position.symbol}</span><div class="bar"><i data-style="width:${percentage.toFixed(2)}%;--bar-color:${position.color}"></i></div><strong>${percentage.toFixed(1)}%</strong></div>`;
  }).join("")}</div>`;
}

function dashboardView() {
  const p = app.data.portfolio;
  const tracked = app.data.markets.filter((item) => app.data.watchlist.includes(item.symbol));
  return `${pageHead("Paper trading overview", "Portfolio pulse", "A deterministic snapshot of a fictional portfolio and market scenario.", `<button class="button primary" type="button" data-view="simulator">New simulation</button>`)}
    <div class="grid kpi-grid">
      <article class="card kpi" data-style="--kpi-color:var(--green)"><span>Simulated equity</span><strong>${displayValue(p.total)}</strong><small>Virtual assets plus cash</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--blue)"><span>Virtual cash</span><strong>${displayValue(p.virtualCash)}</strong><small>Available in this scenario</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--amber)"><span>Invested value</span><strong>${displayValue(p.invested)}</strong><small>${p.positions.length} fictional positions</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--red)"><span>Scenario change</span><strong class="positive">+4.82%</strong><small>Illustrative 30-day window</small></article>
    </div>
    <div class="grid dashboard-grid">
      <article class="card chart-card">
        <header class="card-header"><div><h2>Portfolio trajectory</h2><p>Generated from the local scenario</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Portfolio</span><span><i class="legend-dot blue"></i>Reference</span></div></header>
        <div class="chart-wrap"><canvas id="portfolio-chart" aria-label="Illustrative thirty day portfolio chart"></canvas></div>
      </article>
      <article class="card"><header class="card-header"><div><h2>Allocation</h2><p>Current simulated positions</p></div></header>${allocationList()}</article>
      <article class="card"><header class="card-header"><div><h2>Watchlist</h2><p>Tracked fictional markets</p></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>Low</th><th>High</th><th>Track</th></tr></thead><tbody>${marketRows(tracked)}</tbody></table></div></article>
      <article class="card"><header class="card-header"><div><h2>Recent activity</h2><p>Local simulation history</p></div></header>${activityList(5)}</article>
    </div>`;
}

function marketsView() {
  const query = app.search.toLowerCase();
  const filtered = app.data.markets.filter((item) => `${item.name} ${item.symbol}`.toLowerCase().includes(query));
  const focus = market(app.activeSymbol);
  return `${pageHead("Synthetic market board", "Markets", "Explore fixed demonstration data without live feeds or external connections.")}
    <div class="grid market-grid">
      <article class="card market-focus">
        <div class="market-meta"><div>${assetCell(focus)}</div><span class="${focus.change >= 0 ? "positive" : "negative"}">${focus.change >= 0 ? "+" : ""}${focus.change.toFixed(2)}%</span></div>
        <div><div class="market-price">${displayValue(focus.price, focus.price < 1 ? 4 : 2)}</div><div class="market-symbol">${focus.symbol} / virtual USD</div></div>
        <div class="market-stats"><div class="market-stat"><span>Scenario low</span><strong>${displayValue(focus.price * .982)}</strong></div><div class="market-stat"><span>Scenario high</span><strong>${displayValue(focus.price * 1.018)}</strong></div><div class="market-stat"><span>Dataset</span><strong>Fixed locally</strong></div></div>
      </article>
      <article class="card"><header class="card-header"><div><h2>Selected asset</h2><p>${escapeHtml(focus.name)}</p></div></header><div class="chart-wrap"><canvas id="market-chart" aria-label="Illustrative market series"></canvas></div><button class="button primary" type="button" data-trade="${focus.symbol}">Simulate ${focus.symbol}</button></article>
    </div>
    <article class="card" data-style="margin-top:18px"><header class="card-header"><div><h2>All fictional markets</h2><p>${filtered.length} results</p></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>Low</th><th>High</th><th>Track</th></tr></thead><tbody>${marketRows(filtered)}</tbody></table></div></article>`;
}

function simulatorView() {
  const selected = market(app.activeSymbol);
  const owned = app.data.portfolio.positions.find((item) => item.symbol === selected.symbol)?.quantity || 0;
  const depth = [1.012, 1.008, 1.004, .996, .992, .988];
  return `${pageHead("Virtual execution desk", "Paper trading simulator", "Test a market decision with virtual balances and deterministic prices.")}
    <div class="grid trade-layout">
      <div class="grid">
        <article class="card market-focus">
          <div class="market-meta"><div>${assetCell(selected)}</div><span class="${selected.change >= 0 ? "positive" : "negative"}">${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}%</span></div>
          <div><div class="market-price">${displayValue(selected.price, selected.price < 1 ? 4 : 2)}</div><div class="market-symbol">Fixed fictional quote</div></div>
          <div class="market-stats"><div class="market-stat"><span>Owned</span><strong>${formatNumber(owned)} ${selected.symbol}</strong></div><div class="market-stat"><span>Virtual cash</span><strong>${displayValue(app.data.portfolio.virtualCash)}</strong></div><div class="market-stat"><span>Execution</span><strong>Immediate simulation</strong></div></div>
        </article>
        <article class="card"><header class="card-header"><div><h2>Illustrative depth</h2><p>Generated locally for presentation</p></div></header><div class="depth-list">${depth.map((multiplier, index) => `<div class="depth-row ${index < 3 ? "ask" : ""}" data-style="--depth:${38 + index * 9}%"><span>${displayValue(selected.price * multiplier, selected.price < 1 ? 4 : 2)}</span><span>${formatNumber((index + 2) * 1.274, 3)} ${selected.symbol}</span></div>`).join("")}</div></article>
      </div>
      <article class="card ticket">
        <header class="card-header"><div><h2>Simulation ticket</h2><p>No real asset is involved</p></div></header>
        <div class="segmented" role="group" aria-label="Simulation side"><button class="${app.tradeSide === "BUY" ? "active " : ""}buy" type="button" data-side="BUY">Buy</button><button class="${app.tradeSide === "SELL" ? "active " : ""}sell" type="button" data-side="SELL">Sell</button></div>
        <form id="trade-form" class="form">
          <div class="field"><label for="trade-symbol">Fictional market</label><div class="input-shell"><select id="trade-symbol" name="symbol">${app.data.markets.map((item) => `<option value="${item.symbol}" ${item.symbol === selected.symbol ? "selected" : ""}>${item.symbol} - ${item.name}</option>`).join("")}</select></div></div>
          <div class="field"><label for="trade-quantity">Quantity</label><div class="input-shell"><input id="trade-quantity" name="quantity" type="number" min="0.000001" max="1000000" step="0.000001" value="0.01" required><span>${selected.symbol}</span></div></div>
          <div class="order-summary"><div><span>Fixed price</span><strong id="ticket-price">${displayValue(selected.price, selected.price < 1 ? 4 : 2)}</strong></div><div><span>Estimated virtual total</span><strong id="ticket-total">${displayValue(selected.price * .01)}</strong></div><div><span>Available</span><strong>${app.tradeSide === "BUY" ? displayValue(app.data.portfolio.virtualCash) : `${formatNumber(owned)} ${selected.symbol}`}</strong></div></div>
          <button class="button ${app.tradeSide === "BUY" ? "primary" : "danger"}" type="submit" ${app.busy ? "disabled" : ""}>${app.busy ? "Processing..." : `${app.tradeSide === "BUY" ? "Buy" : "Sell"} virtually`}</button>
          <p class="ticket-note">This action changes only the disposable state stored by this local portfolio demonstration.</p>
        </form>
      </article>
    </div>`;
}

function portfolioView() {
  const p = app.data.portfolio;
  return `${pageHead("Virtual holdings", "Portfolio", "Review the composition of the current fictional scenario.", `<button class="button primary" type="button" data-view="simulator">Adjust scenario</button>`)}
    <div class="grid kpi-grid">
      <article class="card kpi"><span>Total simulation value</span><strong>${displayValue(p.total)}</strong><small>Fictional valuation</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--blue)"><span>Virtual cash</span><strong>${displayValue(p.virtualCash)}</strong><small>${((p.virtualCash / p.total) * 100).toFixed(1)}% of total</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--amber)"><span>Position value</span><strong>${displayValue(p.invested)}</strong><small>${p.positions.length} assets</small></article>
      <article class="card kpi" data-style="--kpi-color:var(--red)"><span>Largest position</span><strong>${p.positions.sort((a,b) => b.value - a.value)[0]?.symbol || "-"}</strong><small>By simulated value</small></article>
    </div>
    <article class="card"><header class="card-header"><div><h2>Positions</h2><p>Calculated with fixed local prices</p></div></header><div class="table-wrap"><table class="data-table"><thead><tr><th>Asset</th><th>Quantity</th><th>Price</th><th>Value</th><th>24h</th><th></th></tr></thead><tbody>${p.positions.map((item) => `<tr><td>${assetCell(item)}</td><td>${formatNumber(item.quantity)}</td><td>${displayValue(item.price, item.price < 1 ? 4 : 2)}</td><td>${displayValue(item.value)}</td><td class="${item.change >= 0 ? "positive" : "negative"}">${item.change >= 0 ? "+" : ""}${item.change.toFixed(2)}%</td><td><button class="button secondary" type="button" data-trade="${item.symbol}">Simulate</button></td></tr>`).join("")}</tbody></table></div></article>`;
}

function activityView() {
  return `${pageHead("Audit trail", "Simulation activity", "Every entry is generated inside this local demonstration.")}
    <article class="card"><header class="card-header"><div><h2>Complete history</h2><p>${app.data.history.length} fictional operations</p></div></header>${activityList()}</article>`;
}

function settingsView() {
  const settings = app.data.settings;
  return `${pageHead("Local preferences", "Settings", "Presentation choices stored only with the disposable simulation state.", `<button class="button danger" type="button" data-reset>Reset demo</button>`)}
    <div class="grid two-col">
      <article class="card"><header class="card-header"><div><h2>Display</h2><p>Customize this browser experience</p></div></header><div class="settings-list">
        <div class="setting-row"><div><strong>Display currency</strong><small>BRL uses a fixed illustrative conversion</small></div><select class="select" data-setting="displayCurrency"><option value="USD" ${settings.displayCurrency === "USD" ? "selected" : ""}>USD</option><option value="BRL" ${settings.displayCurrency === "BRL" ? "selected" : ""}>BRL</option></select></div>
        <div class="setting-row"><div><strong>Compact density</strong><small>Reduce spacing in tables and panels</small></div><button class="toggle ${settings.compactMode ? "active" : ""}" type="button" role="switch" aria-checked="${settings.compactMode}" aria-label="Compact density" data-toggle="compactMode"></button></div>
        <div class="setting-row"><div><strong>Reduced motion</strong><small>Disable interface transitions</small></div><button class="toggle ${settings.reducedMotion ? "active" : ""}" type="button" role="switch" aria-checked="${settings.reducedMotion}" aria-label="Reduced motion" data-toggle="reducedMotion"></button></div>
      </div></article>
      <article class="card"><header class="card-header"><div><h2>Demonstration boundary</h2><p>Designed for safe portfolio review</p></div></header><div class="notice">Ebinex runs on the loopback interface with fictional users, deterministic market data and virtual balances. It has no account connection, live market feed or real-world transaction capability.</div><div class="settings-list" data-style="margin-top:14px"><div class="setting-row"><div><strong>Network mode</strong><small>Loopback only</small></div><strong class="positive">127.0.0.1</strong></div><div class="setting-row"><div><strong>Market source</strong><small>Bundled scenario</small></div><strong>Local</strong></div><div class="setting-row"><div><strong>State</strong><small>Excluded from version control</small></div><strong>Disposable</strong></div></div></article>
    </div>`;
}

function render() {
  if (!app.data) {
    root.innerHTML = `<div class="loading">Loading fictional local scenario...</div>`;
    return;
  }
  document.body.classList.toggle("compact", app.data.settings.compactMode);
  document.body.classList.toggle("reduced-motion", app.data.settings.reducedMotion);
  document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === app.view && button.classList.contains("nav-item")));
  const views = { dashboard: dashboardView, markets: marketsView, simulator: simulatorView, portfolio: portfolioView, activity: activityView, settings: settingsView };
  root.innerHTML = (views[app.view] || dashboardView)();
  applyDataStyles(root);
  requestAnimationFrame(drawCurrentCharts);
}

// O CSP do servidor (style-src 'self') bloqueia atributos style no HTML gerado.
// Os estilos de apresentação (cores, larguras) vão em data-style e são aplicados
// pela CSSOM, que a política permite.
function applyDataStyles(scope) {
  scope.querySelectorAll("[data-style]").forEach((element) => {
    element.dataset.style.split(";").forEach((declaration) => {
      const index = declaration.indexOf(":");
      if (index < 1) return;
      element.style.setProperty(declaration.slice(0, index).trim(), declaration.slice(index + 1).trim());
    });
  });
}

function drawLineChart(canvas, primary, secondary, colors = ["#a78bfa", "#2ee6b6"]) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  context.scale(ratio, ratio);
  const width = rect.width;
  const height = rect.height;
  const padding = 18;
  const all = secondary ? [...primary, ...secondary] : primary;
  const minimum = Math.min(...all) * .97;
  const maximum = Math.max(...all) * 1.03;
  const y = (value) => height - padding - ((value - minimum) / (maximum - minimum || 1)) * (height - padding * 2);
  const x = (index, length) => padding + (index / Math.max(1, length - 1)) * (width - padding * 2);
  // grade discreta e tracejada
  context.strokeStyle = "rgba(167, 139, 250, 0.12)";
  context.lineWidth = 1;
  context.setLineDash([3, 5]);
  for (let row = 0; row < 5; row += 1) {
    const py = padding + row * ((height - padding * 2) / 4);
    context.beginPath(); context.moveTo(padding, py); context.lineTo(width - padding, py); context.stroke();
  }
  context.setLineDash([]);
  const trace = (series) => {
    context.beginPath();
    series.forEach((value, index) => {
      const px = x(index, series.length); const py = y(value);
      if (index === 0) context.moveTo(px, py); else context.lineTo(px, py);
    });
  };
  // séries secundárias primeiro, a principal por cima com área em degradê e brilho
  [secondary, primary].forEach((series, order) => {
    if (!series) return;
    const isPrimary = order === 1;
    const color = isPrimary ? colors[0] : colors[1];
    if (isPrimary) {
      trace(series);
      context.lineTo(x(series.length - 1, series.length), height - padding);
      context.lineTo(x(0, series.length), height - padding);
      context.closePath();
      const fill = context.createLinearGradient(0, padding, 0, height - padding);
      fill.addColorStop(0, "rgba(139, 92, 246, 0.38)");
      fill.addColorStop(1, "rgba(139, 92, 246, 0)");
      context.fillStyle = fill;
      context.fill();
    }
    trace(series);
    context.strokeStyle = color;
    context.lineWidth = isPrimary ? 2.6 : 1.8;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.shadowColor = color;
    context.shadowBlur = isPrimary ? 14 : 6;
    context.globalAlpha = isPrimary ? 1 : 0.85;
    context.stroke();
    context.shadowBlur = 0;
    context.globalAlpha = 1;
    if (isPrimary) {
      const lx = x(series.length - 1, series.length); const ly = y(series[series.length - 1]);
      context.beginPath(); context.arc(lx, ly, 4.5, 0, Math.PI * 2);
      context.fillStyle = "#fff"; context.shadowColor = color; context.shadowBlur = 16; context.fill(); context.shadowBlur = 0;
    }
  });
}

function drawCurrentCharts() {
  const portfolioCanvas = document.querySelector("#portfolio-chart");
  if (portfolioCanvas) {
    const base = app.data.portfolio.total;
    const portfolio = [0.91, .925, .918, .943, .951, .947, .972, .968, .989, 1.006, .998, 1.021, 1.038, 1.048].map((part) => base * part);
    const reference = [0.94, .946, .95, .954, .962, .968, .971, .979, .984, .99, .998, 1.004, 1.012, 1.018].map((part) => base * part);
    drawLineChart(portfolioCanvas, portfolio, reference);
  }
  const marketCanvas = document.querySelector("#market-chart");
  if (marketCanvas) drawLineChart(marketCanvas, market(app.activeSymbol).series);
}

async function refresh() {
  app.data = await api("/api/bootstrap");
  document.querySelector("#profile-name").textContent = app.data.profile.name;
  document.querySelector("#profile-initials").textContent = app.data.profile.initials;
  render();
}

function switchView(view) {
  app.view = view;
  history.replaceState(null, "", `#${view}`);
  render();
  root.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: app.data.settings.reducedMotion ? "auto" : "smooth" });
}

document.addEventListener("click", async (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) { switchView(viewButton.dataset.view); return; }

  const tradeButton = event.target.closest("[data-trade]");
  if (tradeButton) { app.activeSymbol = tradeButton.dataset.trade; switchView("simulator"); return; }

  const sideButton = event.target.closest("[data-side]");
  if (sideButton) { app.tradeSide = sideButton.dataset.side; render(); return; }

  const watchButton = event.target.closest("[data-watch]");
  if (watchButton) {
    try {
      const result = await api("/api/watchlist", { method: "POST", body: JSON.stringify({ symbol: watchButton.dataset.watch }) });
      app.data.watchlist = result.watchlist;
      render();
      showToast("Watchlist updated locally.");
    } catch (error) { showToast(error.message, "error"); }
    return;
  }

  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const field = toggle.dataset.toggle;
    await saveSettings({ [field]: !app.data.settings[field] });
    return;
  }

  if (event.target.closest("[data-reset]")) dialog.showModal();
});

document.addEventListener("change", async (event) => {
  if (event.target.id === "trade-symbol") {
    app.activeSymbol = event.target.value;
    render();
  }
  if (event.target.matches("[data-setting]")) {
    await saveSettings({ [event.target.dataset.setting]: event.target.value });
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "trade-quantity") {
    const quantity = Number(event.target.value || 0);
    const total = document.querySelector("#ticket-total");
    if (total) total.textContent = displayValue(market(app.activeSymbol).price * Math.max(0, quantity));
  }
});

document.addEventListener("submit", async (event) => {
  if (event.target.id !== "trade-form") return;
  event.preventDefault();
  if (app.busy) return;
  const form = new FormData(event.target);
  app.busy = true;
  render();
  try {
    const result = await api("/api/trades", { method: "POST", body: JSON.stringify({ symbol: form.get("symbol"), side: app.tradeSide, quantity: Number(form.get("quantity")) }) });
    app.data.portfolio = result.portfolio;
    app.data.history = result.history;
    showToast(`${result.trade.side === "BUY" ? "Virtual buy" : "Virtual sell"} completed for ${result.trade.symbol}.`);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    app.busy = false;
    render();
  }
});

async function saveSettings(change) {
  try {
    const result = await api("/api/settings", { method: "PUT", body: JSON.stringify(change) });
    app.data.settings = result.settings;
    render();
    showToast("Local preferences saved.");
  } catch (error) { showToast(error.message, "error"); }
}

dialog.addEventListener("close", async () => {
  if (dialog.returnValue !== "confirm") return;
  try {
    app.data = await api("/api/reset", { method: "POST", body: "{}" });
    app.activeSymbol = "BTC";
    app.tradeSide = "BUY";
    render();
    showToast("Fictional starting scenario restored.");
  } catch (error) { showToast(error.message, "error"); }
});

searchInput.addEventListener("input", () => {
  app.search = searchInput.value.trim().slice(0, 24);
  if (app.view !== "markets") app.view = "markets";
  render();
});

window.addEventListener("resize", () => requestAnimationFrame(drawCurrentCharts));

(async function initialize() {
  const requestedView = location.hash.replace("#", "");
  if (["dashboard", "markets", "simulator", "portfolio", "activity", "settings"].includes(requestedView)) app.view = requestedView;
  try {
    await refresh();
  } catch {
    root.innerHTML = `<div class="empty"><div><strong>Local demo unavailable</strong><p>Restart the Ebinex server and refresh this page.</p></div></div>`;
  }
}());
