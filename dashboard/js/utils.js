/**
 * Portfolio Dashboard Utilities
 * Contains reusable components and functions for portfolio management dashboard
 */

// Import dependencies
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as htl from "https://cdn.jsdelivr.net/npm/htl@0.3.1/+esm";

const html = htl.html;

// ========== FORMATTING UTILITIES ==========

export function formatCurrency(value, currency = "$", decimals = 0) {
  if (typeof value !== 'number') return "N/A";
  return currency + d3.format(`,.${decimals}f`)(value);
}

export function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number') return "N/A";
  return d3.format(`,.${decimals}f`)(value);
}

export function formatPercent(value, decimals = 2) {
  if (typeof value !== 'number') return "N/A";
  return d3.format(`.${decimals}%`)(value);
}

// ========== UI COMPONENTS ==========

export function createRangeInput({
  min, max, value, step, label, 
  formatFunc = String, 
  format = null,
  currency = "$",
  decimals = 2,
  id = "", 
  minLabel = null, 
  maxLabel = null
}) {
  try {
    // Input validation
    if (typeof min !== 'number' || typeof max !== 'number' || 
        typeof value !== 'number' || typeof step !== 'number') {
      throw new Error("Numeric parameters must be numbers");
    }
    
    if (min >= max) throw new Error("Min must be less than max");
    
    if (value < min || value > max) {
      value = Math.max(min, Math.min(max, value));
    }
    
    // Override formatFunc if a predefined format is specified
    if (format) {
      switch (format.toLowerCase()) {
        case 'percent': formatFunc = val => formatPercent(val, decimals); break;
        case 'currency': formatFunc = val => formatCurrency(val, currency, decimals); break;
        case 'integer': formatFunc = val => formatNumber(val, 0); break;
        case 'decimal': formatFunc = val => formatNumber(val, decimals); break;
      }
    }
    
    // Create elements
    const container = document.createElement("div");
    container.className = "input-slider-container";
    
    const labelEl = document.createElement("label");
    labelEl.className = "input-slider-label";
    labelEl.textContent = label;
    
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.className = "range-slider";
    if (id) input.id = id;
    
    const labelsDiv = document.createElement("div");
    labelsDiv.className = "slider-labels";
    
    const minSpan = document.createElement("span");
    minSpan.className = "min-label";
    minSpan.textContent = minLabel ?? formatFunc(min);
    
    const valueSpan = document.createElement("span");
    valueSpan.className = "value-label";
    valueSpan.textContent = formatFunc(value);
    
    const maxSpan = document.createElement("span");
    maxSpan.className = "max-label";
    maxSpan.textContent = maxLabel ?? formatFunc(max);
    
    // Assemble the elements
    labelsDiv.append(minSpan, valueSpan, maxSpan);
    container.append(labelEl, input, labelsDiv);
    
    // Event handling
    input.oninput = () => {
      valueSpan.textContent = formatFunc(input.valueAsNumber);
      container.value = input.valueAsNumber;
      container.dispatchEvent(new Event("input"));
    };
    
    // Value property
    Object.defineProperty(container, "value", {
      get: () => input.valueAsNumber,
      set: (v) => {
        input.value = v;
        valueSpan.textContent = formatFunc(v);
      },
      enumerable: true,
      configurable: true
    });
    
    return container;
  } catch (e) {
    console.error("Error creating range input:", e);
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error creating range input: ${e.message}`;
    return errorDiv;
  }
}

export function createPercentInput({min, max, value, step, label, id = "", decimals = 2}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'percent', decimals
  });
}
  
export function createNumericInput({min, max, value, step, label, id = "", decimals = 2}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'decimal', decimals
  });
}

export function createCurrencyInput({min, max, value, step, label, id = "", currency = "$", decimals = 0}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'currency', currency, decimals
  });
}

export function createDateInput({
  min, max, value, label, id = ""
}) {
  try {
    // Input validation
    if (!(min instanceof Date) || !(max instanceof Date) || !(value instanceof Date)) {
      throw new Error("Date parameters must be Date objects");
    }
    
    if (min > max) throw new Error("Min date must be before max date");
    
    if (value < min || value > max) {
      value = new Date(Math.max(min.getTime(), Math.min(max.getTime(), value.getTime())));
    }
    
    // Format dates for input
    const formatDateForInput = date => date.toISOString().split('T')[0];
    
    // Create elements
    const container = document.createElement("div");
    container.className = "date-input-container";
    
    const labelEl = document.createElement("label");
    labelEl.className = "date-input-label";
    labelEl.textContent = label;
    
    const input = document.createElement("input");
    input.type = "date";
    input.min = formatDateForInput(min);
    input.max = formatDateForInput(max);
    input.value = formatDateForInput(value);
    input.className = "date-input";
    if (id) input.id = id;
    
    // Format for display
    const formatDate = date => d3.timeFormat("%b %d, %Y")(date);
    
    const valueDisplay = document.createElement("div");
    valueDisplay.className = "date-value-display";
    // valueDisplay.textContent = formatDate(value);
    
    // Assemble the elements
    container.append(labelEl, input, valueDisplay);
    
    // Event handling
    input.oninput = () => {
      const dateVal = new Date(input.value);
      // valueDisplay.textContent = formatDate(dateVal);
      container.value = dateVal;
      container.dispatchEvent(new Event("input"));
    };
    
    // Value property
    Object.defineProperty(container, "value", {
      get: () => new Date(input.value),
      set: (v) => {
        if (v instanceof Date) {
          input.value = formatDateForInput(v);
          valueDisplay.textContent = formatDate(v);
        }
      },
      enumerable: true,
      configurable: true
    });
    
    return container;
  } catch (e) {
    console.error("Error creating date input:", e);
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error creating date input: ${e.message}`;
    return errorDiv;
  }
}
  
export function createAssetAllocationSlider({
  value, 
  asset1Name = "Bonds", 
  asset2Name = "Equity", 
  asset1Color = "#4682B4", 
  asset2Color = "#FF7F50",
  onOptimize = null
}) {
  try {
    // Validate and clamp value
    if (typeof value !== 'number' || value < 0 || value > 1) {
      value = Math.max(0, Math.min(1, value));
    }
    
    // Create container
    const container = document.createElement("div");
    container.className = "allocation-slider-container";
    
    // Create button
    const buttonDiv = document.createElement("div");
    buttonDiv.className = "optimize-btn-container";
    
    const optimizeButton = document.createElement("button");
    optimizeButton.className = "btn btn-sm optimize-btn";
    optimizeButton.textContent = "Maximize Sharpe";
    
    // Create slider
    const input = document.createElement("input");
    input.type = "range";
    input.min = 0;
    input.max = 1;
    input.step = 0.01;
    input.value = value;
    input.className = "range-slider allocation-slider";
    
    // Create labels
    const labelsDiv = document.createElement("div");
    labelsDiv.className = "allocation-labels";
    
    // Create labels with direct color styling
    const asset1Label = document.createElement("div");
    asset1Label.className = "asset1-label";
    asset1Label.style.color = asset1Color; // Apply color directly to style
    asset1Label.textContent = `${(100 - value * 100).toFixed(0)}% ${asset1Name}`;
    
    const asset2Label = document.createElement("div");
    asset2Label.className = "asset2-label";
    asset2Label.style.color = asset2Color; // Apply color directly to style
    asset2Label.textContent = `${(value * 100).toFixed(0)}% ${asset2Name}`;
    
    // Assemble
    buttonDiv.appendChild(optimizeButton);
    labelsDiv.append(asset1Label, asset2Label);
    container.append(buttonDiv, input, labelsDiv);
    
    // Event handling
    input.oninput = () => {
      asset1Label.textContent = `${(100 - input.value * 100).toFixed(0)}% ${asset1Name}`;
      asset2Label.textContent = `${(input.value * 100).toFixed(0)}% ${asset2Name}`;
      container.value = input.valueAsNumber;
      container.dispatchEvent(new Event("input"));
    };
    
    // Optimize button handler
    if (typeof onOptimize === 'function') {
      optimizeButton.onclick = () => {
        try {
          const optimalValue = onOptimize();
          if (typeof optimalValue === 'number' && optimalValue >= 0 && optimalValue <= 1) {
            input.value = optimalValue;
            asset1Label.textContent = `${(100 - optimalValue * 100).toFixed(0)}% ${asset1Name}`;
            asset2Label.textContent = `${(optimalValue * 100).toFixed(0)}% ${asset2Name}`;
            container.value = optimalValue;
            container.dispatchEvent(new Event("input"));
          }
        } catch (e) {
          console.error("Optimization error:", e);
          alert("Optimization failed: " + e.message);
        }
      };
    } else {
      optimizeButton.style.display = "none";
    }
    
    // Value property
    Object.defineProperty(container, "value", {
      get: () => input.valueAsNumber,
      set: (v) => {
        input.value = v;
        asset1Label.textContent = `${(100 - v * 100).toFixed(0)}% ${asset1Name}`;
        asset2Label.textContent = `${(v * 100).toFixed(0)}% ${asset2Name}`;
      },
      enumerable: true,
      configurable: true
    });
    
    return container;
  } catch (e) {
    console.error("Error creating asset allocation slider:", e);
    return createErrorElement(e.message);
  }
}

export function createHoldingsTable(items, formatFunc = formatPercent) {
  if (!items?.length) {
    return createMessageElement("No data available");
  }
  
  try {
    const container = document.createElement("div");
    container.style.marginTop = "15px";
    
    const title = document.createElement("strong");
    title.textContent = "Holdings:";
    
    const tableContainer = document.createElement("div");
    tableContainer.style.maxHeight = "200px";
    tableContainer.style.overflowY = "auto";
    
    const table = document.createElement("table");
    table.className = "table table-sm";
    table.style.fontSize = "0.85rem";
    
    // Create header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    ["Ticker", "Portfolio Weight", "Complete Portfolio Weight"].forEach(text => {
      const th = document.createElement("th");
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create body
    const tbody = document.createElement("tbody");
    const sortedItems = [...items]
      .sort((a, b) => b.Weight - a.Weight)
      .slice(0, 10);
    
    sortedItems.forEach(item => {
      const row = document.createElement("tr");
      
      const tickerCell = document.createElement("td");
      tickerCell.textContent = item.Ticker;
      
      const weightCell = document.createElement("td");
      weightCell.textContent = formatFunc(item.Weight);
      
      const completeWeightCell = document.createElement("td");
      completeWeightCell.textContent = formatFunc(item.extraWeight || 0);
      
      row.append(tickerCell, weightCell, completeWeightCell);
      tbody.appendChild(row);
    });
    
    table.append(thead, tbody);
    tableContainer.appendChild(table);
    container.append(title, tableContainer);
    
    return container;
  } catch (e) {
    console.error("Error creating holdings table:", e);
    return createErrorElement(e.message);
  }
}

// ========== PORTFOLIO CALCULATIONS ==========

export function calculatePortfolioStats(w_risky, er_risky, std_dev_risky, risk_free_rate) {
  try {
    validateNumericInputs(w_risky, er_risky, std_dev_risky, risk_free_rate);
    
    if (w_risky < 0 || w_risky > 1) {
      throw new Error("Weight must be between 0 and 1");
    }
    
    if (std_dev_risky < 0) {
      throw new Error("Standard deviation cannot be negative");
    }
    
    const w_rf = 1 - w_risky;
    const er_portfolio = w_risky * er_risky + w_rf * risk_free_rate;
    const std_dev_portfolio = w_risky * std_dev_risky;
    
    return {er: er_portfolio, std_dev: std_dev_portfolio};
  } catch (e) {
    console.error("Error calculating portfolio stats:", e);
    return {er: 0, std_dev: 0, error: e.message};
  }
}
  
export function calculateUtility(er, std_dev, risk_aversion) {
  try {
    validateNumericInputs(er, std_dev, risk_aversion);
    
    if (std_dev < 0) throw new Error("Standard deviation cannot be negative");
    if (risk_aversion < 0) throw new Error("Risk aversion cannot be negative");
    
    return er - 0.5 * risk_aversion * Math.pow(std_dev, 2);
  } catch (e) {
    console.error("Utility calculation error:", e);
    return 0;
  }
}
  
export function findOptimalEquityWeight({
  equity_return, equity_std, bond_return, bond_std, correlation, rf_rate
}) {
  try {
    validateNumericInputs(equity_return, equity_std, bond_return, bond_std, correlation, rf_rate);
    
    if (equity_std <= 0 || bond_std <= 0) {
      throw new Error("Standard deviations must be positive");
    }
    
    if (correlation < -1 || correlation > 1) {
      throw new Error("Correlation must be between -1 and 1");
    }
    
    // Use grid search to find optimal weight
    let maxSharpe = -Infinity;
    let optimalWeight = 0.5;
    
    for (let w = 0; w <= 1; w += 0.01) {
      const bondW = 1 - w;
      const er = (w * equity_return) + (bondW * bond_return);
      const sd = Math.sqrt(
        Math.pow(w, 2) * Math.pow(equity_std, 2) + 
        Math.pow(bondW, 2) * Math.pow(bond_std, 2) + 
        2 * w * bondW * equity_std * bond_std * correlation
      );
      
      if (sd === 0) continue;
      
      const sharpe = (er - rf_rate) / sd;
      if (sharpe > maxSharpe) {
        maxSharpe = sharpe;
        optimalWeight = w;
      }
    }
    
    return optimalWeight;
  } catch (e) {
    console.error("Error finding optimal equity weight:", e);
    return 0.5;
  }
}
  
export function calculateRiskBasedAllocation(rf_rate, er_risky, std_dev_risky, market_view, risk_score) {
  try {
    validateNumericInputs(rf_rate, er_risky, std_dev_risky, market_view, risk_score);
    
    if (std_dev_risky <= 0) throw new Error("Standard deviation must be positive");
    
    if (market_view < 0 || market_view > 100 || risk_score < 0 || risk_score > 100) {
      throw new Error("Market view and risk score must be between 0 and 100");
    }
    
    // Calculate risk aversion index
    const risk_aversion_index = market_view * (1 - risk_score/100);
    
    // Calculate optimal weight
    let risk_aversion_weight = (er_risky - rf_rate) / (risk_aversion_index * Math.pow(std_dev_risky, 2));
    
    // Handle edge cases & clamp
    if (!isFinite(risk_aversion_weight) || isNaN(risk_aversion_weight)) {
      risk_aversion_weight = 0;
    }
    
    risk_aversion_weight = Math.max(0, Math.min(1, risk_aversion_weight));
    
    return { risk_aversion_index, risk_aversion_weight };
  } catch (e) {
    console.error("Risk allocation error:", e);
    return { risk_aversion_index: 0, risk_aversion_weight: 0, error: e.message };
  }
}

export function calculateRiskyPortfolioMetrics(
  equity_weight, equity_return, equity_std, bond_return, bond_std, correlation
) {
  try {
    validateNumericInputs(equity_weight, equity_return, equity_std, bond_return, bond_std, correlation);
    
    if (equity_weight < 0 || equity_weight > 1) {
      throw new Error("Equity weight must be between 0 and 1");
    }
    
    if (equity_std < 0 || bond_std < 0) {
      throw new Error("Standard deviations cannot be negative");
    }
    
    if (correlation < -1 || correlation > 1) {
      throw new Error("Correlation must be between -1 and 1");
    }
    
    const bond_weight = 1 - equity_weight;
    
    // Calculate expected return and standard deviation
    const er_risky = (equity_weight * equity_return) + (bond_weight * bond_return);
    const std_dev_risky = Math.sqrt(
      Math.pow(equity_weight, 2) * Math.pow(equity_std, 2) + 
      Math.pow(bond_weight, 2) * Math.pow(bond_std, 2) + 
      2 * equity_weight * bond_weight * equity_std * bond_std * correlation
    );
    
    return { er_risky, std_dev_risky, bond_weight };
  } catch (e) {
    console.error("Portfolio metrics error:", e);
    return { 
      er_risky: 0, 
      std_dev_risky: 0, 
      bond_weight: 1 - equity_weight,
      error: e.message 
    };
  }
}
  
export function categorizeValue(value, thresholds, labels) {
  try {
    if (!Array.isArray(thresholds) || !Array.isArray(labels)) {
      throw new Error("Thresholds and labels must be arrays");
    }
    
    if (thresholds.length !== labels.length) {
      throw new Error("Thresholds and labels must have the same length");
    }
    
    if (typeof value !== 'number') {
      throw new Error("Value must be a number");
    }
    
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) {
        return `${labels[i]} (${value})`;
      }
    }
    return `${labels[labels.length-1]} (${value})`;
  } catch (e) {
    console.error("Error categorizing value:", e);
    return `Error: ${e.message}`;
  }
}
  
export function generatePortfolioData(rf_rate, er_risky, std_dev_risky, market_view, risk_score) {
  try {
    validateNumericInputs(rf_rate, er_risky, std_dev_risky, market_view, risk_score);
    
    if (std_dev_risky <= 0) throw new Error("Standard deviation must be positive");
    
    // Risk-based allocation
    const riskAllocation = calculateRiskBasedAllocation(
      rf_rate, er_risky, std_dev_risky, market_view, risk_score
    );
    
    const risk_aversion_index = riskAllocation.risk_aversion_index;
    const risk_aversion_weight = riskAllocation.risk_aversion_weight;
    
    // Portfolio stats
    const optimal_stats = calculatePortfolioStats(
      risk_aversion_weight, er_risky, std_dev_risky, rf_rate
    );
    
    const er_optimal = optimal_stats.er;
    const std_dev_optimal = optimal_stats.std_dev;
    const utility_optimal = calculateUtility(er_optimal, std_dev_optimal, risk_aversion_index);
    
    // Sharpe ratio
    const sharpe_ratio = std_dev_risky > 0 ? (er_risky - rf_rate) / std_dev_risky : 0;
    
    // Generate portfolio weights data
    const weights = Array.from({length: 11}, (_, i) => i/10);
    const allocation_data = weights.map(w => {
      const stats = calculatePortfolioStats(w, er_risky, std_dev_risky, rf_rate);
      const utility = calculateUtility(stats.er, stats.std_dev, risk_aversion_index);
      
      return {
        Weight: w,
        Weight_Pct: `${(w*100).toFixed(0)}%`,
        Expected_Return: stats.er,
        Standard_Deviation: stats.std_dev,
        Utility: utility
      };
    });
    
    // Find max utility index
    const utilities = allocation_data.map(d => d.Utility);
    const max_utility_idx = utilities.indexOf(Math.max(...utilities));
    
    // Generate chart data with finer grain
    const w_fine = Array.from({length: 100}, (_, i) => i/99);
    const chart_data = w_fine.map(w => {
      const stats = calculatePortfolioStats(w, er_risky, std_dev_risky, rf_rate);
      const utility = calculateUtility(stats.er, stats.std_dev, risk_aversion_index);
      
      return {
        Weight: w,
        Expected_Return: stats.er,
        Standard_Deviation: stats.std_dev,
        Utility: utility
      };
    });
    
    return {
      allocation_data,
      chart_data,
      optimal_weight: risk_aversion_weight,
      risk_aversion_weight,
      er_optimal,
      std_dev_optimal,
      utility_optimal,
      sharpe_ratio,
      max_utility_idx,
      risk_aversion_index
    };
  } catch (e) {
    console.error("Error generating portfolio data:", e);
    return {
      allocation_data: [],
      chart_data: [],
      optimal_weight: 0,
      risk_aversion_weight: 0,
      er_optimal: 0,
      std_dev_optimal: 0,
      utility_optimal: 0,
      sharpe_ratio: 0,
      max_utility_idx: 0,
      risk_aversion_index: 0,
      error: e.message
    };
  }
}

// ========== DATA PROCESSING UTILITIES ==========

export function processQuotesData(daily_quotes, equity_tickers) {
  if (!daily_quotes?.Ticker || !daily_quotes?.Date || !daily_quotes?.Close) {
    console.error("Invalid daily_quotes structure");
    return null;
  }
  
  // Create ticker data mapping
  const tickerData = {};
  
  for (let i = 0; i < daily_quotes.Ticker.length; i++) {
    const ticker = daily_quotes.Ticker[i];
    const date = new Date(daily_quotes.Date[i]);
    const close = daily_quotes.Close[i];
    const type = daily_quotes.Type?.[i];
    
    if (close === null || isNaN(close) || type === "Other") continue;
    
    if (!tickerData[ticker]) {
      tickerData[ticker] = { dates: [], prices: [], types: [] };
    }
    
    tickerData[ticker].dates.push(date);
    tickerData[ticker].prices.push(close);
    tickerData[ticker].types.push(type);
  }
  
  // Process ticker data
  const processedData = {};
  
  for (const [ticker, data] of Object.entries(tickerData)) {
    if (data.prices.length === 0) continue;
    
    // Sort data by date
    const sorted = data.dates.map((date, i) => ({
      date,
      price: data.prices[i],
      type: data.types[i]
    })).sort((a, b) => a.date - b.date);
    
    // Get first and last prices and dates
    const firstPrice = sorted[0].price;
    const lastPrice = sorted[sorted.length - 1].price;
    const firstDate = sorted[0].date;
    const lastDate = sorted[sorted.length - 1].date;
    const type = sorted[0].type;
    
    // Find weight if available
    let weight = 1;
    if (Array.isArray(equity_tickers)) {
      const tickerInfo = equity_tickers.find(t => t.Ticker === ticker);
      if (tickerInfo) {
        weight = typeof tickerInfo.Weight === 'string' 
          ? parseFloat(tickerInfo.Weight.replace('%', '')) / 100
          : (!isNaN(tickerInfo.Weight) ? tickerInfo.Weight : 1);
      }
    }
    
    processedData[ticker] = { 
      firstPrice, 
      lastPrice, 
      firstDate,  // Store the first date
      lastDate,   // Store the last date
      weight, 
      type 
    };
  }
  
  return processedData;
}

export function calculateAssetClassWeights(tickerPrices) {
  let equityTotal = 0;
  let bondTotal = 0;
  let equityTickers = [];
  let bondTickers = [];
  
  for (const [ticker, priceData] of Object.entries(tickerPrices)) {
    const type = priceData.type || "Equity";
    
    if (type === "Equity") {
      equityTotal += priceData.weight;
      equityTickers.push(ticker);
    } else if (type === "Bond") {
      bondTotal += priceData.weight;
      bondTickers.push(ticker);
    }
  }
  
  return { equityTotal, bondTotal, equityTickers, bondTickers };
}

export function calculateTickerWeights(
  ticker, type, priceData, assetClassTotals, 
  equity_weight = 0.6, bond_weight = 0.4, fixed_optimal_weight = 1.0
) {
  const { equityTotal, bondTotal } = assetClassTotals;
  
  // Calculate within-class weight
  const assetClassWeight = type === "Equity"
    ? (equityTotal > 0 ? priceData.weight / equityTotal : 0)
    : (bondTotal > 0 ? priceData.weight / bondTotal : 0);
  
  // Calculate risky portfolio weight
  const riskyPfWeight = type === "Equity"
    ? assetClassWeight * equity_weight
    : assetClassWeight * bond_weight;
      
  // Calculate complete portfolio weight
  const completeWeight = riskyPfWeight * fixed_optimal_weight;
  
  return { assetClassWeight, riskyPfWeight, completeWeight };
}

export function generateSamplePortfolioData(tickers, initialAmount) {
  if (!Array.isArray(tickers) || tickers.length === 0) return [];
  
  const sampleData = [];
  const today = new Date();
  
  // Generate data for each ticker
  tickers.forEach(ticker => {
    const weight = ticker.Weight || 0.2;
    let price = 100; // Starting price
    
    // Generate 6 months of data
    for (let i = 180; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      price *= 1 + (Math.random() - 0.5) * 0.015; // Add random volatility
      
      sampleData.push({
        Date: date,
        Close: price * weight * initialAmount / 100,
        Ticker: ticker.Ticker,
        Portfolio: ticker.Ticker,
        Type: ticker.Type
      });
    }
  });
  
  // Add portfolio totals
  const dateGroups = d3.group(sampleData, d => d.Date.toISOString().split('T')[0]);
  for (const [date, values] of dateGroups) {
    sampleData.push({
      Date: new Date(date),
      Close: d3.sum(values, d => d.Close),
      Portfolio: "Total Portfolio",
      Ticker: "TOTAL",
      Type: "Portfolio"
    });
  }
  
  return sampleData;
}

export function calculatePortfolioReturns(quotes, tickers, initialAmount) {
  // Validate inputs
  if (!quotes?.Date?.length || !quotes.Ticker || !quotes.Close || !Array.isArray(tickers)) {
    console.error("Invalid input data");
    return [];
  }
  
  // Process weight data
  const weights = {};
  tickers.forEach(d => {
    let weight = d.Weight;
    if (typeof weight === "string") {
      weight = parseFloat(weight.replace("%", "")) / 100;
    }
    weights[d.Ticker] = weight;
  });
  
  // Convert to row data
  const rowData = [];
  for (let i = 0; i < quotes.Date.length; i++) {
    rowData.push({
      Date: new Date(quotes.Date[i]),
      Ticker: quotes.Ticker[i],
      Close: quotes.Close[i],
      Type: quotes.Type?.[i] || 'Equity'
    });
  }
  
  // Calculate ticker performance
  const tickerGroups = d3.group(rowData, d => d.Ticker);
  const tickerPerformance = [];
  const tickerFirstLastPrices = {};
  
  for (const [ticker, values] of tickerGroups) {
    if (!weights[ticker]) continue;
    
    // Sort values by date
    const sortedValues = [...values].sort((a, b) => a.Date - b.Date);
    if (sortedValues.length === 0) continue;
    
    // Store price data
    tickerFirstLastPrices[ticker] = {
      firstPrice: sortedValues[0].Close,
      lastPrice: sortedValues[sortedValues.length - 1].Close,
      weight: weights[ticker]
    };
    
    // Calculate shares and performance
    const numberOfShares = initialAmount * weights[ticker] / sortedValues[0].Close;
    
    sortedValues.forEach(d => {
      tickerPerformance.push({
        Date: d.Date,
        Close: d.Close * numberOfShares,
        RawClose: d.Close,
        Portfolio: ticker,
        Ticker: ticker,
        Type: d.Type
      });
    });
  }
  
  // Calculate portfolio totals
  const dateGroups = d3.group(tickerPerformance, d => d.Date.toISOString().split('T')[0]);
  const portfolioTotal = [];
  
  for (const [date, values] of dateGroups) {
    portfolioTotal.push({
      Date: new Date(date),
      Close: d3.sum(values, d => d.Close),
      Portfolio: "Total Portfolio",
      Ticker: "TOTAL",
      Type: "Portfolio"
    });
  }
  
  // Combine and sort all data
  const sortedPortfolioData = [...tickerPerformance, ...portfolioTotal]
    .sort((a, b) => a.Date - b.Date);
  
  // Add metadata
  const dates = quotes.Date.map(d => new Date(d));
  sortedPortfolioData.datasetDateRange = {
    startDate: new Date(Math.min(...dates)),
    endDate: new Date(Math.max(...dates))
  };
  sortedPortfolioData.tickerFirstLastPrices = tickerFirstLastPrices;
  
  return sortedPortfolioData;
}

// ========== HELPER FUNCTIONS ==========

function validateNumericInputs(...args) {
  for (let i = 0; i < args.length; i++) {
    if (typeof args[i] !== 'number') {
      throw new Error(`Parameter at index ${i} must be a number`);
    }
  }
}

function createMessageElement(message) {
  const div = document.createElement("div");
  div.textContent = message;
  return div;
}

function createErrorElement(message) {
  const div = document.createElement("div");
  div.className = "alert alert-danger";
  div.textContent = `Error: ${message}`;
  return div;
}