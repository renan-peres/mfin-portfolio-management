/**
 * Portfolio Dashboard Utilities
 * Contains reusable components and functions for portfolio management dashboard
 */

// Import the libraries directly in the module
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as htl from "https://cdn.jsdelivr.net/npm/htl@0.3.1/+esm";
const html = htl.html;

/**
 * Creates a portfolio value chart with interactive features
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.dailyQuotes - Daily price quotes data with Date, Ticker, Close properties
 * @param {Object} options.processedQuotes - Processed quotes data keyed by ticker
 * @param {Array} options.enrichedSecurities - Array of enriched security data
 * @param {Array} options.equityTickers - Array of equity ticker information
 * @param {Number} options.investmentAmount - Initial investment amount
 * @param {Number} options.equityWeight - Target weight for equities
 * @param {Number} options.bondWeight - Target weight for bonds
 * @param {Number} options.fixedOptimalWeight - Target weight for risk-free assets
 * @param {Function} options.selectedDateHandler - Handler export function for date selection
 * @param {Object} options.formatters - Formatting functions
 * @param {Object} options.style - Visual styling options
 * @returns {HTMLElement} - Container with the chart
 */

export function createPortfolioValueChart(options) {
  const {
    dailyQuotes,
    processedQuotes,
    enrichedSecurities,
    equityTickers,
    investmentAmount,
    equityWeight,
    bondWeight,
    fixedOptimalWeight,
    selectedDateHandler,
    formatters = {},
    style = {}
  } = options;
  
  // Define default styles that can be overridden
  const chartStyle = {
    baseFontSize: style.baseFontSize || 12,
    labelFontSize: style.labelFontSize || 12,
    valueFontSize: style.valueFontSize || 12,
    titleFontSize: style.titleFontSize || 14,
    tooltipFontSize: style.tooltipFontSize || 14
  };
  
  const formatCurrency = formatters.currency || (val => `$${d3.format(",")(val.toFixed(0))}`);
  
  /* ─── Guards ─────────────────────────────────────────── */
  if (!dailyQuotes?.Ticker || !dailyQuotes?.Date || !dailyQuotes?.Close)
    return html`<div class="alert alert-warning">No price time‑series data available for charting</div>`;

  /* ─── Asset weights & shares ────────────────────────── */
  const { tickerWeights, tickerTypes } = getTickerWeightsAndTypes(
    enrichedSecurities,
    processedQuotes,  // Use processedQuotes instead of tickerPrices
    equityTickers,
    equityWeight,
    bondWeight,
    fixedOptimalWeight
  );

  /* ─── Daily close matrix date → {ticker:price} ─────── */
  const dateTickerPrices = createDateTickerPriceMap(dailyQuotes);
  const sortedDates = Object.keys(dateTickerPrices).sort();

  /* ─── Earliest date with full data set ─────────────── */
  const earliest = findEarliestCompleteDate(sortedDates, dateTickerPrices, tickerWeights);
  if (!earliest)
    return html`<div class="alert alert-warning">Cannot find a date where all tickers have valid price data</div>`;

  /* ─── Shares per ticker based on initial weights ───── */
  const { tickerShares, tickerInitialValues } = calculateSharesAndInitialValues(
    tickerWeights,
    tickerTypes,
    dateTickerPrices[earliest],
    investmentAmount
  );

  /* ─── Portfolio value time‑series with special Risk-Free handling ───── */
  const portfolioTS = calculatePortfolioTimeSeries(
    sortedDates,
    dateTickerPrices,
    tickerWeights,
    tickerTypes,
    tickerShares,
    tickerInitialValues
  );

  if (portfolioTS.length === 0)
    return html`<div class="alert alert-warning">Not enough data points to generate chart</div>`;

  /* Calculate key metrics */
  const chartMetrics = calculateChartMetrics(portfolioTS);
  
  /* ─── Create the chart ────────────────────────────────── */
  const plot = createPlot(portfolioTS, chartMetrics, formatCurrency, chartStyle);
  
  /* ─── Add interactivity ────────────────────────────── */
  return createInteractiveContainer(plot, portfolioTS, chartMetrics, selectedDateHandler, formatCurrency, chartStyle);
}

/**
 * Get ticker weights and types from enriched securities or calculate from scratch
 */
export function getTickerWeightsAndTypes(
  enrichedSecurities, tickerPrices, equityTickers, equityWeight, bondWeight, fixedOptimalWeight
) {
  const tickerWeights = {};
  const tickerTypes = {};
  
  if (enrichedSecurities && enrichedSecurities.length > 0) {
    for (const security of enrichedSecurities) {
      const ticker = security.Ticker;
      if (!tickerPrices[ticker]) continue;
      
      tickerWeights[ticker] = {
        weight: security.completeWeight,
        type: security.Type
      };
      tickerTypes[ticker] = security.Type;
    }
  } else {
    // Fall back to traditional method - make sure these functions are available
    const assetClassTotals = calculateAssetClassWeights(tickerPrices);
    
    for (const [ticker, priceData] of Object.entries(tickerPrices)) {
      // skip invalid price rows
      if (!priceData.firstPrice || !priceData.lastPrice || priceData.firstPrice <= 0 || priceData.lastPrice <= 0) continue;

      const info = Array.isArray(equityTickers) ? equityTickers.find(t => t.Ticker === ticker) : {};
      const type = info?.Type ?? priceData.type ?? "Equity";

      tickerWeights[ticker] = {
        weight: calculateTickerWeights(ticker, type, priceData,
                                    assetClassTotals, equityWeight,
                                    bondWeight, fixedOptimalWeight).completeWeight,
        type
      };
      tickerTypes[ticker] = type;
    }
  }
  
  return { tickerWeights, tickerTypes };
}

/**
 * Create a map of dates to ticker prices
 */
export function  createDateTickerPriceMap(dailyQuotes) {
  const dateTickerPrices = {};
  for (let i = 0; i < dailyQuotes.Date.length; i++) {
    const date = new Date(dailyQuotes.Date[i]).toISOString().split("T")[0];
    const ticker = dailyQuotes.Ticker[i];
    const close = dailyQuotes.Close[i];
    if (!dateTickerPrices[date]) dateTickerPrices[date] = {};
    dateTickerPrices[date][ticker] = close;
  }
  return dateTickerPrices;
}

/**
 * Find the earliest date where all tickers have valid prices
 */
export function  findEarliestCompleteDate(sortedDates, dateTickerPrices, tickerWeights) {
  return sortedDates.find(date =>
    Object.keys(tickerWeights).every(t => Number.isFinite(dateTickerPrices[date]?.[t]))
  );
}

/**
 * Calculate shares and initial values for each ticker
 */
export function  calculateSharesAndInitialValues(tickerWeights, tickerTypes, earliestPrices, investmentAmount) {
  const tickerShares = {};
  const tickerInitialValues = {};
  
  for (const ticker of Object.keys(tickerWeights)) {
    const initPx = earliestPrices[ticker];
    const initInv = investmentAmount * tickerWeights[ticker].weight;
    tickerInitialValues[ticker] = initInv;
    
    // Calculate shares only for non-risk-free assets
    if (tickerTypes[ticker] !== "Risk‑Free") {
      tickerShares[ticker] = initInv / initPx;
    }
  }
  
  return { tickerShares, tickerInitialValues };
}

/**
 * Calculate portfolio value time series
 */
export function  calculatePortfolioTimeSeries(
  sortedDates, dateTickerPrices, tickerWeights, tickerTypes, tickerShares, tickerInitialValues
) {
  return sortedDates.flatMap(date => {
    const prices = dateTickerPrices[date];
    // We only need price data for non-risk-free assets
    const validPrices = Object.keys(tickerWeights)
      .filter(t => tickerTypes[t] !== "Risk‑Free")
      .every(t => Number.isFinite(prices?.[t]));
      
    if (!validPrices) return [];
    
    // Calculate portfolio value with special handling for Risk-Free assets
    let pv = 0;
    
    for (const ticker of Object.keys(tickerWeights)) {
      if (tickerTypes[ticker] === "Risk‑Free") {
        // Risk-Free assets maintain initial value
        pv += tickerInitialValues[ticker];
      } else {
        // Regular assets follow market prices
        pv += prices[ticker] * tickerShares[ticker];
      }
    }
    
    return [{ Date: new Date(date), Close: pv }];
  });
}

/**
 * Calculate key metrics for the chart
 */
export function  calculateChartMetrics(portfolioTS) {
  const initVal = portfolioTS[0].Close;
  const currVal = portfolioTS.at(-1).Close;
  const totalRet = initVal ? currVal / initVal - 1 : 0;
  const startDate = portfolioTS[0].Date;
  const endDate = portfolioTS.at(-1).Date;
  const yearsDiff = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
  const perfColor = totalRet >= 0 ? "#28a745" : "#dc3545";
  
  return {
    initVal,
    currVal,
    totalRet,
    startDate,
    endDate,
    yearsDiff,
    perfColor
  };
}

/**
 * Create the Plot.js chart
 */
export function createPlot(portfolioTS, metrics, formatCurrency, style = {}) {
  return Plot.plot({
    marginLeft: 80, marginRight: 20,
    style: { 
      fontSize: `${style.baseFontSize}px`, 
      background: "transparent", 
      overflow: "visible" 
    },
    x: {
      type: "time",
      label: "Date:",
      domain: [metrics.startDate, metrics.endDate],
      tickFormat: d => `Q${Math.floor(d.getMonth() / 3) + 1}'${d.getFullYear().toString().slice(-2)}`
    },
    y: {
      grid: true,
      label: "Portfolio Value ($):",
      labelOffset: 45,
      domain: [0, Math.max(d3.max(portfolioTS, d => d.Close) * 1.05, metrics.initVal * 1.05)],
      tickFormat: d => formatCurrency(d)
    },
    marks: [
      Plot.ruleY([metrics.initVal], { stroke: "#0b3040", strokeWidth: 2.5, strokeDasharray: "4 4" }),
      Plot.text([{ x: metrics.startDate, y: metrics.initVal }], {
        text: `Initial Investment: ${formatCurrency(metrics.initVal)}`,
        dy: -8, 
        fontSize: style.labelFontSize, 
        fontWeight: "bold", 
        textAnchor: "start"
      }),
      Plot.areaY(portfolioTS, { x: "Date", y: "Close", fill: metrics.perfColor, fillOpacity: 0.1, curve: "natural" }),
      Plot.lineY(portfolioTS, {
        x: "Date", y: "Close", stroke: metrics.perfColor, strokeWidth: 3, curve: "natural",
        tip: { 
          format: { 
            x: d => d3.timeFormat("%b %d, %Y")(d),
            y: v => formatCurrency(v),
            "Gain:": v => `${((v / metrics.initVal - 1) * 100).toFixed(2)}%`
          }
        },
        channels: {
          "Gain:": d => d.Close
        }
      }),
      Plot.text([portfolioTS.at(-1)], {
        x: "Date", y: "Close",
        text: `Current Value: ${formatCurrency(metrics.currVal)}`,
        dx: 5, 
        dy: -15, 
        fontSize: style.valueFontSize, 
        fontWeight: "bold"
      }),
      Plot.text([portfolioTS.at(-1)], {
        x: "Date", y: "Close",
        text: `${metrics.totalRet >= 0 ? "+" : ""}${(metrics.totalRet * 100).toFixed(2)}%`,
        dx: 5, 
        dy: 15, 
        fontSize: style.valueFontSize, 
        fontWeight: "bold", 
        fill: metrics.perfColor
      }),
      // Add pointer interactivity elements
      Plot.ruleX(portfolioTS, Plot.pointerX({x: "Date", stroke: metrics.perfColor, strokeWidth: 1.5, strokeDasharray: "4 4"})),
      Plot.dot(portfolioTS, Plot.pointerX({x: "Date", y: "Close", fill: metrics.perfColor, stroke: "white", strokeWidth: 2, r: 5}))
    ]
  });
}

/**
 * Create container with interactive features
 */
export function createInteractiveContainer(plot, portfolioTS, metrics, selectedDateHandler, formatCurrency, style = {}) {
  const xScale = plot.scale("x");
  const yScale = plot.scale("y");
  
  // Create loading overlay and container
  const container = html`<div style="position: relative;">
    <div class="chart-loading-overlay" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
         background: rgba(255,255,255,0.7); z-index: 10; align-items: center; justify-content: center;">
      <div style="text-align: center;">
        <div class="spinner-border text-primary" role="status"></div>
        <div style="margin-top: 10px; font-weight: bold;">Updating metrics...</div>
      </div>
    </div>
    ${plot}
    <div class="hover-tooltip" style="position: absolute; display: none; background: white; 
         border: 1px solid #ddd; border-radius: 3px; padding: 8px; pointer-events: none;
         box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 20; font-size: ${style.tooltipFontSize}px;"></div>
    <div class="hover-dot" style="position: absolute; width: 12px; height: 12px; border-radius: 50%; 
         background-color: ${metrics.perfColor}; border: 2px solid white; display: none; transform: translate(-50%, -50%); 
         pointer-events: none; z-index: 15;"></div>
  </div>`;
  
  const loadingOverlay = container.querySelector(".chart-loading-overlay");
  const hoverTooltip = container.querySelector(".hover-tooltip");
  const hoverDot = container.querySelector(".hover-dot");
  
  // Add hover functionality
  plot.addEventListener("pointermove", (event) => {
    const { left, top } = plot.getBoundingClientRect();
    const px = event.clientX - left;
    const date = xScale.invert(px);
    
    if (!date || isNaN(date)) {
      hoverDot.style.display = "none";
      hoverTooltip.style.display = "none";
      return;
    }
    
    // Find the closest data point
    const closest = portfolioTS.reduce((best, d) => 
      Math.abs(d.Date - date) < Math.abs(best.Date - date) ? d : best
    );
    
    // Position the dot at the data point
    const dotX = xScale(closest.Date);
    const dotY = yScale(closest.Close);
    
    if (isNaN(dotX) || isNaN(dotY)) {
      hoverDot.style.display = "none";
      return;
    }
    
    // Update dot position and make visible
    hoverDot.style.left = `${dotX}px`;
    hoverDot.style.top = `${dotY}px`;
    hoverDot.style.display = "block";
    
    // Show tooltip with date and value
    hoverTooltip.innerHTML = `
      <div><strong>${d3.timeFormat("%b %d, %Y")(closest.Date)}</strong></div>
      <div>Value: ${formatCurrency(closest.Close)}</div>
    `;
    hoverTooltip.style.display = "block";
    
    // Position tooltip
    const tooltipX = Math.min(event.clientX - left + 10, plot.clientWidth - hoverTooltip.offsetWidth - 5);
    const tooltipY = Math.max(event.clientY - top - hoverTooltip.offsetHeight - 10, 5);
    hoverTooltip.style.transform = `translate(${tooltipX}px, ${tooltipY}px)`;
  });
  
  // Hide elements when mouse leaves
  plot.addEventListener("pointerleave", () => {
    hoverDot.style.display = "none";
    hoverTooltip.style.display = "none";
  });
  
  // Handle date selection on click
  plot.addEventListener("click", ev => {
    const { left } = plot.getBoundingClientRect();
    const px = ev.clientX - left;
    const date = xScale.invert(px);
    if (!date || isNaN(date)) return;
    
    // Find nearest data point
    const closest = portfolioTS.reduce((best, d) => 
      Math.abs(d.Date - date) < Math.abs(best.Date - date) ? d : best
    );
    
    // Show loading overlay
    loadingOverlay.style.display = "flex";
    
    // Update selected date
    if (selectedDateHandler) {
      // Make sure the date is properly formatted
      const clickedDate = new Date(closest.Date);
      
      // Call the handler with the clicked date
      selectedDateHandler(clickedDate, () => {
        loadingOverlay.style.display = "none";
      });
    } else {
      loadingOverlay.style.display = "none";
    }
  });

  return container;
}