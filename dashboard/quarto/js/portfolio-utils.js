/**
 * Portfolio Dashboard Utilities
 * Contains reusable components and functions for portfolio management dashboard
 */

// Import d3 and html from CDNs instead of bare module specifiers
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as htl from "https://cdn.jsdelivr.net/npm/htl@0.3.1/+esm";

// The html object from htl
const html = htl.html;

// ========== FORMATTING UTILITIES ==========

/**
 * Format a number as currency
 * @param {number} value - The value to format
 * @param {string} currency - Currency symbol (default: "$")
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = "$", decimals = 0) {
  if (typeof value !== 'number') {
    console.warn("formatCurrency received non-numeric value:", value);
    return "N/A";
  }
  return currency + d3.format(`,.${decimals}f`)(value);
}

/**
 * Format a number with comma separators
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export function formatNumber(value, decimals = 2) {
  if (typeof value !== 'number') {
    console.warn("formatNumber received non-numeric value:", value);
    return "N/A";
  }
  return d3.format(`,.${decimals}f`)(value);
}

/**
 * Format a number as a percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
  if (typeof value !== 'number') {
    console.warn("formatPercent received non-numeric value:", value);
    return "N/A";
  }
  return d3.format(`.${decimals}%`)(value);
}

// ========== UI COMPONENTS ==========

/**
 * Create a range input slider
 * @param {Object} options - Configuration options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @param {number} options.value - Initial value
 * @param {number} options.step - Step size
 * @param {string} options.label - Label text
 * @param {Function} options.formatFunc - Function to format values (default: String)
 * @param {string} options.format - Predefined format type ('percent', 'currency', 'integer', 'decimal')
 * @param {string} options.currency - Currency symbol for currency format (default: "$")
 * @param {number} options.decimals - Decimal places for number formats (default: 2)
 * @param {string} options.id - Optional ID for the element
 * @param {string} options.minLabel - Optional custom label for minimum value
 * @param {string} options.maxLabel - Optional custom label for maximum value
 * @returns {HTMLElement} Range input element with labels
 */
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
    if (typeof min !== 'number' || typeof max !== 'number' || typeof value !== 'number' || typeof step !== 'number') {
      throw new Error("Numeric parameters (min, max, value, step) must be numbers");
    }
    
    if (min >= max) {
      throw new Error("Min must be less than max");
    }
    
    if (value < min || value > max) {
      console.warn(`Initial value ${value} is outside range [${min}, ${max}], clamping.`);
      value = Math.max(min, Math.min(max, value));
    }
    
    // Override formatFunc if a predefined format is specified
    if (format) {
      switch (format.toLowerCase()) {
        case 'percent':
          formatFunc = val => formatPercent(val, decimals);
          break;
        case 'currency':
          formatFunc = val => formatCurrency(val, currency, decimals);
          break;
        case 'integer':
          formatFunc = val => formatNumber(val, 0);
          break;
        case 'decimal':
          formatFunc = val => formatNumber(val, decimals);
          break;
      }
    }
    
    // Create container and elements
    const container = document.createElement("div");
    container.style.marginBottom = "12px";
    container.style.background = "rgba(255, 255, 255, 0.08)";
    container.style.borderRadius = "6px";
    container.style.padding = "10px";
    container.style.border = "1px solid rgba(255, 255, 255, 0.15)";
    
    // Create label
    const labelEl = document.createElement("label");
    labelEl.style.display = "block";
    labelEl.style.marginBottom = "6px";
    labelEl.style.fontWeight = "500";
    labelEl.style.color = "#cce6ff";
    labelEl.style.fontSize = "0.9rem";
    labelEl.textContent = label;
    container.appendChild(labelEl);
    
    // Create input
    const input = document.createElement("input");
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.style.width = "100%";
    input.style.height = "6px";
    input.style.appearance = "none";
    input.style.background = "linear-gradient(to right, #4682B4, #FF7F50)";
    input.style.borderRadius = "3px";
    if (id) input.id = id;
    container.appendChild(input);
    
    // Add thumb styling with CSS
    const style = document.createElement('style');
    style.textContent = `
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: #fff;
        border: 2px solid #5cffb6;
        height: 18px;
        width: 18px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
      input[type=range]::-moz-range-thumb {
        background: #fff;
        border: 2px solid #5cffb6;
        height: 18px;
        width: 18px;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
    `;
    document.head.appendChild(style);
    
    // Create labels container
    const labelsDiv = document.createElement("div");
    labelsDiv.style.display = "flex";
    labelsDiv.style.justifyContent = "space-between";
    labelsDiv.style.marginTop = "8px";
    
    // Create min label
    const minSpan = document.createElement("span");
    minSpan.style.fontSize = "0.8rem";
    minSpan.style.color = "rgba(255, 255, 255, 0.8)";
    minSpan.textContent = minLabel ?? formatFunc(min);
    labelsDiv.appendChild(minSpan);
    
    // Create value label
    const valueSpan = document.createElement("span");
    valueSpan.style.fontSize = "0.9rem";
    valueSpan.style.fontWeight = "bold";
    valueSpan.style.color = "#ffcc5c";
    valueSpan.textContent = formatFunc(value);
    labelsDiv.appendChild(valueSpan);
    
    // Create max label
    const maxSpan = document.createElement("span");
    maxSpan.style.fontSize = "0.8rem";
    maxSpan.style.color = "rgba(255, 255, 255, 0.8)";
    maxSpan.textContent = maxLabel ?? formatFunc(max);
    labelsDiv.appendChild(maxSpan);
    
    container.appendChild(labelsDiv);
    
    // Set up event handling
    input.oninput = () => {
      valueSpan.textContent = formatFunc(input.valueAsNumber);
      container.value = input.valueAsNumber;
      container.dispatchEvent(new Event("input"));
    };
    
    // Set initial value property on the container
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

/**
 * Create a percentage range input slider
 * @param {Object} options - Configuration options (see createRangeInput)
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @returns {HTMLElement} Percentage input control
 */
export function createPercentInput({min, max, value, step, label, id = "", decimals = 2}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'percent', decimals
  });
}
  
/**
 * Create a numeric range input slider
 * @param {Object} options - Configuration options (see createRangeInput)
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @returns {HTMLElement} Numeric input control
 */
export function createNumericInput({min, max, value, step, label, id = "", decimals = 2}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'decimal', decimals
  });
}

/**
 * Create a currency range input slider
 * @param {Object} options - Configuration options (see createRangeInput)
 * @param {string} options.currency - Currency symbol (default: "$")
 * @param {number} options.decimals - Number of decimal places (default: 0)
 * @returns {HTMLElement} Currency input control
 */
export function createCurrencyInput({min, max, value, step, label, id = "", currency = "$", decimals = 0}) {
  return createRangeInput({
    min, max, value, step, label, id, format: 'currency', currency, decimals
  });
}
  
/**
 * Create an asset allocation slider with labels for two assets
 * @param {Object} options - Configuration options
 * @param {number} options.value - Initial value (weight of second asset)
 * @param {string} options.asset1Name - Name of first asset (default: "Bonds")
 * @param {string} options.asset2Name - Name of second asset (default: "Equity")
 * @param {string} options.asset1Color - Color for first asset (default: "#4682B4")
 * @param {string} options.asset2Color - Color for second asset (default: "#FF7F50")
 * @param {Function} options.onOptimize - Function to call for optimization (returns optimal weight)
 * @returns {HTMLElement} Asset allocation slider control
 */
export function createAssetAllocationSlider({
  value, 
  asset1Name = "Bonds", 
  asset2Name = "Equity", 
  asset1Color = "#4682B4", 
  asset2Color = "#FF7F50",
  onOptimize = null
}) {
  try {
    // Input validation
    if (typeof value !== 'number' || value < 0 || value > 1) {
      console.warn(`Invalid value ${value} for asset allocation, clamping to [0,1]`);
      value = Math.max(0, Math.min(1, value));
    }
    
    // Create container
    const container = document.createElement("div");
    container.style.paddingBottom = "10px";
    
    // Create button container
    const buttonDiv = document.createElement("div");
    buttonDiv.style.display = "flex";
    buttonDiv.style.justifyContent = "space-between";
    buttonDiv.style.alignItems = "center";
    buttonDiv.style.marginBottom = "5px";
    
    // Create optimize button
    const optimizeButton = document.createElement("button");
    optimizeButton.className = "btn btn-sm";
    optimizeButton.style.marginBottom = "12px";
    optimizeButton.style.backgroundColor = "#0b3040";
    optimizeButton.style.color = "white";
    optimizeButton.style.borderColor = "#0b3040";
    optimizeButton.textContent = "Maximize Sharpe";
    buttonDiv.appendChild(optimizeButton);
    container.appendChild(buttonDiv);
    
    // Create input
    const input = document.createElement("input");
    input.type = "range";
    input.min = 0;
    input.max = 1;
    input.step = 0.01;
    input.value = value;
    input.style.width = "100%";
    container.appendChild(input);
    
    // Create labels container
    const labelsDiv = document.createElement("div");
    labelsDiv.style.display = "flex";
    labelsDiv.style.justifyContent = "space-between";
    labelsDiv.style.width = "100%";
    
    // Create asset1 label
    const asset1Label = document.createElement("div");
    asset1Label.className = "asset1-label";
    asset1Label.style.color = asset1Color;
    asset1Label.style.fontWeight = "bold";
    asset1Label.textContent = `${(100 - value * 100).toFixed(0)}% ${asset1Name}`;
    labelsDiv.appendChild(asset1Label);
    
    // Create asset2 label
    const asset2Label = document.createElement("div");
    asset2Label.className = "asset2-label";
    asset2Label.style.color = asset2Color;
    asset2Label.style.fontWeight = "bold";
    asset2Label.textContent = `${(value * 100).toFixed(0)}% ${asset2Name}`;
    labelsDiv.appendChild(asset2Label);
    
    container.appendChild(labelsDiv);
    
    // Set up event handling
    input.oninput = () => {
      asset1Label.textContent = `${(100 - input.value * 100).toFixed(0)}% ${asset1Name}`;
      asset2Label.textContent = `${(input.value * 100).toFixed(0)}% ${asset2Name}`;
      container.value = input.valueAsNumber;
      container.dispatchEvent(new Event("input"));
    };
    
    // Add click handler for the optimize button
    if (typeof onOptimize === 'function') {
      optimizeButton.onclick = () => {
        try {
          const optimalValue = onOptimize();
          if (typeof optimalValue !== 'number' || optimalValue < 0 || optimalValue > 1) {
            throw new Error(`Invalid optimal value: ${optimalValue}`);
          }
          input.value = optimalValue;
          asset1Label.textContent = `${(100 - optimalValue * 100).toFixed(0)}% ${asset1Name}`;
          asset2Label.textContent = `${(optimalValue * 100).toFixed(0)}% ${asset2Name}`;
          container.value = optimalValue;
          container.dispatchEvent(new Event("input"));
        } catch (e) {
          console.error("Error during optimization:", e);
          alert("Optimization failed: " + e.message);
        }
      };
    } else {
      optimizeButton.style.display = "none";
    }
    
    // Set initial value property on the container
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
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error creating asset allocation slider: ${e.message}`;
    return errorDiv;
  }
}

/**
 * Create a holdings table for displaying portfolio items
 * @param {Array} items - Array of portfolio items with Ticker and Weight properties
 * @param {Function} formatFunc - Function to format weight values (default: formatPercent)
 * @returns {HTMLElement} Portfolio holdings table
 */
export function createHoldingsTable(items, formatFunc = formatPercent) {
  try {
    if (!items || items.length === 0) {
      const noDataDiv = document.createElement("div");
      noDataDiv.textContent = "No data available";
      return noDataDiv;
    }
    
    const container = document.createElement("div");
    container.style.marginTop = "15px";
    
    const title = document.createElement("strong");
    title.textContent = "Holdings:";
    container.appendChild(title);
    
    const tableContainer = document.createElement("div");
    tableContainer.style.maxHeight = "200px";
    tableContainer.style.overflowY = "auto";
    
    const table = document.createElement("table");
    table.className = "table table-sm";
    table.style.fontSize = "0.85rem";
    
    // Create table header
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    
    const tickerHeader = document.createElement("th");
    tickerHeader.textContent = "Ticker";
    headerRow.appendChild(tickerHeader);
    
    const weightHeader = document.createElement("th");
    weightHeader.textContent = "Portfolio Weight";
    headerRow.appendChild(weightHeader);
    
    const completeWeightHeader = document.createElement("th");
    completeWeightHeader.textContent = "Complete Portfolio Weight";
    headerRow.appendChild(completeWeightHeader);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    // Sort items by weight and take top 10
    const sortedItems = [...items].sort((a, b) => b.Weight - a.Weight).slice(0, 10);
    
    sortedItems.forEach(item => {
      const row = document.createElement("tr");
      
      const tickerCell = document.createElement("td");
      tickerCell.textContent = item.Ticker;
      row.appendChild(tickerCell);
      
      const weightCell = document.createElement("td");
      weightCell.textContent = formatFunc(item.Weight);
      row.appendChild(weightCell);
      
      const completeWeightCell = document.createElement("td");
      completeWeightCell.textContent = formatFunc(item.extraWeight || 0);
      row.appendChild(completeWeightCell);
      
      tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
    
    return container;
  } catch (e) {
    console.error("Error creating holdings table:", e);
    const errorDiv = document.createElement("div");
    errorDiv.className = "alert alert-danger";
    errorDiv.textContent = `Error creating holdings table: ${e.message}`;
    return errorDiv;
  }
}

// ========== PORTFOLIO CALCULATIONS ==========

/**
 * Calculate portfolio statistics for a capital allocation
 * @param {number} w_risky - Weight of risky assets
 * @param {number} er_risky - Expected return of risky assets
 * @param {number} std_dev_risky - Standard deviation of risky assets
 * @param {number} risk_free_rate - Risk-free rate
 * @returns {Object} Portfolio stats with er and std_dev properties
 */
export function calculatePortfolioStats(w_risky, er_risky, std_dev_risky, risk_free_rate) {
  try {
    // Input validation
    if (typeof w_risky !== 'number' || w_risky < 0 || w_risky > 1) {
      throw new Error("Weight of risky assets must be a number between 0 and 1");
    }
    
    if (typeof er_risky !== 'number' || typeof std_dev_risky !== 'number' || typeof risk_free_rate !== 'number') {
      throw new Error("Expected return, standard deviation, and risk-free rate must be numbers");
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
  
/**
 * Calculate portfolio utility based on risk preferences
 * @param {number} er - Expected return
 * @param {number} std_dev - Standard deviation
 * @param {number} risk_aversion - Risk aversion coefficient
 * @returns {number} Utility value
 */
export function calculateUtility(er, std_dev, risk_aversion) {
  try {
    // Input validation
    if (typeof er !== 'number' || typeof std_dev !== 'number' || typeof risk_aversion !== 'number') {
      throw new Error("Expected return, standard deviation, and risk aversion must be numbers");
    }
    
    if (std_dev < 0) {
      throw new Error("Standard deviation cannot be negative");
    }
    
    if (risk_aversion < 0) {
      throw new Error("Risk aversion cannot be negative");
    }
    
    return er - 0.5 * risk_aversion * Math.pow(std_dev, 2);
  } catch (e) {
    console.error("Error calculating utility:", e);
    return 0;
  }
}
  
/**
 * Find the optimal equity weight for maximum Sharpe ratio
 * @param {Object} params - Parameters object
 * @param {number} params.equity_return - Expected return of equity
 * @param {number} params.equity_std - Standard deviation of equity
 * @param {number} params.bond_return - Expected return of bonds
 * @param {number} params.bond_std - Standard deviation of bonds
 * @param {number} params.correlation - Correlation between equity and bonds
 * @param {number} params.rf_rate - Risk-free rate
 * @returns {number} Optimal equity weight (0-1)
 */
export function findOptimalEquityWeight(params) {
  try {
    const {equity_return, equity_std, bond_return, bond_std, correlation, rf_rate} = params;
    
    // Input validation
    if (typeof equity_return !== 'number' || typeof equity_std !== 'number' || 
        typeof bond_return !== 'number' || typeof bond_std !== 'number' || 
        typeof correlation !== 'number' || typeof rf_rate !== 'number') {
      throw new Error("All parameters must be numbers");
    }
    
    if (equity_std <= 0 || bond_std <= 0) {
      throw new Error("Standard deviations must be positive");
    }
    
    if (correlation < -1 || correlation > 1) {
      throw new Error("Correlation must be between -1 and 1");
    }
    
    // Using a grid search for optimal equity weight
    let maxSharpe = -Infinity;
    let optimalEquityWeight = 0.5; // Start at 50/50
    
    // Use finer grid for more accuracy
    for (let w = 0; w <= 1; w += 0.01) {
      const bondW = 1 - w;
      const er = (w * equity_return) + (bondW * bond_return);
      const sd = Math.sqrt(
        Math.pow(w, 2) * Math.pow(equity_std, 2) + 
        Math.pow(bondW, 2) * Math.pow(bond_std, 2) + 
        2 * w * bondW * equity_std * bond_std * correlation
      );
      
      // Avoid division by zero
      if (sd === 0) continue;
      
      const sharpe = (er - rf_rate) / sd;
      if (sharpe > maxSharpe) {
        maxSharpe = sharpe;
        optimalEquityWeight = w;
      }
    }
    
    return optimalEquityWeight;
  } catch (e) {
    console.error("Error finding optimal equity weight:", e);
    return 0.5; // Default to 50/50 on error
  }
}
  
/**
 * Calculate risk-based allocation using risk aversion
 * @param {number} rf_rate - Risk-free rate
 * @param {number} er_risky - Expected return of risky assets
 * @param {number} std_dev_risky - Standard deviation of risky assets
 * @param {number} market_view - Market view score (0-100)
 * @param {number} risk_score - Risk tolerance score (0-100)
 * @returns {Object} Object with risk_aversion_index and risk_aversion_weight
 */
export function calculateRiskBasedAllocation(rf_rate, er_risky, std_dev_risky, market_view, risk_score) {
  try {
    // Input validation
    if (typeof rf_rate !== 'number' || typeof er_risky !== 'number' || 
        typeof std_dev_risky !== 'number' || typeof market_view !== 'number' || 
        typeof risk_score !== 'number') {
      throw new Error("All inputs must be numbers");
    }
    
    if (std_dev_risky <= 0) {
      throw new Error("Standard deviation must be positive");
    }
    
    if (market_view < 0 || market_view > 100 || risk_score < 0 || risk_score > 100) {
      throw new Error("Market view and risk score must be between 0 and 100");
    }
    
    // Calculate risk aversion index
    const risk_aversion_index = market_view * (1 - risk_score/100);
    
    // Calculate optimal weight analytically
    let risk_aversion_weight = (er_risky - rf_rate) / (risk_aversion_index * Math.pow(std_dev_risky, 2));
    
    // Handle edge cases
    if (!isFinite(risk_aversion_weight) || isNaN(risk_aversion_weight)) {
      risk_aversion_weight = 0;
    }
    
    // Clamp weight between 0 and 1
    risk_aversion_weight = Math.max(0, Math.min(1, risk_aversion_weight));
    
    return {
      risk_aversion_index,
      risk_aversion_weight
    };
  } catch (e) {
    console.error("Error calculating risk-based allocation:", e);
    return {
      risk_aversion_index: 0,
      risk_aversion_weight: 0,
      error: e.message
    };
  }
}

/**
 * Calculate risky portfolio metrics (expected return and std dev)
 * @param {number} equity_weight - Weight of equity
 * @param {number} equity_return - Expected return of equity
 * @param {number} equity_std - Standard deviation of equity
 * @param {number} bond_return - Expected return of bonds
 * @param {number} bond_std - Standard deviation of bonds
 * @param {number} correlation - Correlation between equity and bonds
 * @returns {Object} Object with er_risky, std_dev_risky, and bond_weight
 */
export function calculateRiskyPortfolioMetrics(equity_weight, equity_return, equity_std, bond_return, bond_std, correlation) {
  try {
    // Input validation
    if (typeof equity_weight !== 'number' || equity_weight < 0 || equity_weight > 1) {
      throw new Error("Equity weight must be between 0 and 1");
    }
    
    if (typeof equity_return !== 'number' || typeof equity_std !== 'number' || 
        typeof bond_return !== 'number' || typeof bond_std !== 'number' || 
        typeof correlation !== 'number') {
      throw new Error("All return and risk parameters must be numbers");
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
    
    return {
      er_risky,
      std_dev_risky,
      bond_weight
    };
  } catch (e) {
    console.error("Error calculating risky portfolio metrics:", e);
    return {
      er_risky: 0,
      std_dev_risky: 0,
      bond_weight: 1 - equity_weight,
      error: e.message
    };
  }
}
  
/**
 * Categorize a value into a descriptive label
 * @param {number} value - Value to categorize
 * @param {Array<number>} thresholds - Array of thresholds
 * @param {Array<string>} labels - Array of labels corresponding to thresholds
 * @returns {string} Descriptive label with value
 */
export function categorizeValue(value, thresholds, labels) {
  try {
    if (!Array.isArray(thresholds) || !Array.isArray(labels)) {
      throw new Error("Thresholds and labels must be arrays");
    }
    
    if (thresholds.length !== labels.length) {
      throw new Error("Thresholds and labels arrays must have the same length");
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
  
/**
 * Generate comprehensive portfolio data
 * @param {number} rf_rate - Risk-free rate
 * @param {number} er_risky - Expected return of risky assets
 * @param {number} std_dev_risky - Standard deviation of risky assets
 * @param {number} market_view - Market view score (0-100)
 * @param {number} risk_score - Risk tolerance score (0-100)
 * @returns {Object} Complete portfolio data for visualization
 */
export function generatePortfolioData(rf_rate, er_risky, std_dev_risky, market_view, risk_score) {
  try {
    // Input validation
    if (typeof rf_rate !== 'number' || typeof er_risky !== 'number' || 
        typeof std_dev_risky !== 'number' || typeof market_view !== 'number' || 
        typeof risk_score !== 'number') {
      throw new Error("All inputs must be numbers");
    }
    
    if (std_dev_risky <= 0) {
      throw new Error("Standard deviation must be positive");
    }
    
    // Calculate risk aversion and weights
    const riskAllocation = calculateRiskBasedAllocation(
      rf_rate, er_risky, std_dev_risky, market_view, risk_score
    );
    
    const risk_aversion_index = riskAllocation.risk_aversion_index;
    const risk_aversion_weight = riskAllocation.risk_aversion_weight;
    
    // Calculate portfolio stats
    const optimal_stats = calculatePortfolioStats(
      risk_aversion_weight, er_risky, std_dev_risky, rf_rate
    );
    
    const er_optimal = optimal_stats.er;
    const std_dev_optimal = optimal_stats.std_dev;
    const utility_optimal = calculateUtility(er_optimal, std_dev_optimal, risk_aversion_index);
    
    // Calculate Sharpe ratio (with check for division by zero)
    let sharpe_ratio = 0;
    if (std_dev_risky > 0) {
      sharpe_ratio = (er_risky - rf_rate) / std_dev_risky;
    }
    
    // Generate portfolio weights data for table
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

/**
 * Process quotes data to extract first and last prices
 * @param {Object} daily_quotes - Daily quotes data object
 * @param {Array} equity_tickers - Array of equity ticker information
 * @returns {Object} Processed ticker price data
 */
export function processQuotesData(daily_quotes, equity_tickers) {
  if (!daily_quotes || !daily_quotes.Ticker || !daily_quotes.Date || !daily_quotes.Close) {
    console.error("Invalid daily_quotes data structure");
    return null;
  }
  
  // Create a structured mapping of ticker data
  const tickerData = {};
  
  for (let i = 0; i < daily_quotes.Ticker.length; i++) {
    const ticker = daily_quotes.Ticker[i];
    const date = new Date(daily_quotes.Date[i]);
    const close = daily_quotes.Close[i];
    const type = daily_quotes.Type[i];
    
    // Skip entries with null prices or type "Other"
    if (close === null || isNaN(close) || type === "Other") continue;
    
    if (!tickerData[ticker]) {
      tickerData[ticker] = {
        dates: [],
        prices: [],
        types: []
      };
    }
    
    tickerData[ticker].dates.push(date);
    tickerData[ticker].prices.push(close);
    tickerData[ticker].types.push(type);
  }
  
  // For each ticker, find first and last valid prices
  const processedData = {};
  
  for (const [ticker, data] of Object.entries(tickerData)) {
    if (data.prices.length === 0) continue;
    
    // Sort dates and prices together
    const sorted = data.dates.map((date, i) => ({
      date,
      price: data.prices[i],
      type: data.types[i]
    })).sort((a, b) => a.date - b.date);
    
    // Get first and last valid prices
    const firstPrice = sorted[0].price;
    const lastPrice = sorted[sorted.length - 1].price;
    const type = sorted[0].type;
    
    // Find weight from equity_tickers if available
    let weight = 1;
    if (Array.isArray(equity_tickers)) {
      const tickerInfo = equity_tickers.find(t => t.Ticker === ticker);
      if (tickerInfo && typeof tickerInfo.Weight === 'string') {
        // Handle percentage strings like "10.00%"
        weight = parseFloat(tickerInfo.Weight.replace('%', '')) / 100;
      } else if (tickerInfo && !isNaN(tickerInfo.Weight)) {
        weight = tickerInfo.Weight;
      }
    }
    
    processedData[ticker] = {
      firstPrice,
      lastPrice,
      weight,
      type
    };
  }
  
  return processedData;
}

/**
 * Calculate asset class weights from ticker prices
 * @param {Object} tickerPrices - Ticker price data
 * @returns {Object} Object with equity and bond totals and tickers
 */
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
  
  return { 
    equityTotal, 
    bondTotal,
    equityTickers,
    bondTickers
  };
}

/**
 * Calculate ticker weights within asset classes and portfolio
 * @param {string} ticker - Ticker symbol
 * @param {string} type - Asset type (Equity/Bond)
 * @param {Object} priceData - Price data for ticker
 * @param {Object} assetClassTotals - Asset class weight totals
 * @param {number} equity_weight - Overall equity weight
 * @param {number} bond_weight - Overall bond weight
 * @param {number} fixed_optimal_weight - Complete portfolio weight
 * @returns {Object} Calculated weights for the ticker
 */
export function calculateTickerWeights(ticker, type, priceData, assetClassTotals, equity_weight = 0.6, bond_weight = 0.4, fixed_optimal_weight = 1.0) {
  const { equityTotal, bondTotal } = assetClassTotals;
  
  // Calculate normalized weight within asset class
  const assetClassWeight = 
    type === "Equity" ? 
      (equityTotal > 0 ? priceData.weight / equityTotal : 0) : 
      (bondTotal > 0 ? priceData.weight / bondTotal : 0);
  
  // Calculate weight in risky portfolio
  const riskyPfWeight = 
    type === "Equity" ?
      assetClassWeight * equity_weight :
      assetClassWeight * bond_weight;
      
  // Calculate weight in complete portfolio
  const completeWeight = riskyPfWeight * fixed_optimal_weight;
  
  return {
    assetClassWeight,
    riskyPfWeight,
    completeWeight
  };
}

/**
 * Generate sample portfolio data when real data is unavailable
 * @param {Array} tickers - Array of ticker information
 * @param {number} initialAmount - Initial investment amount
 * @returns {Array} Sample portfolio data
 */
export function generateSamplePortfolioData(tickers, initialAmount) {
  if (!Array.isArray(tickers) || tickers.length === 0) return [];
  
  const sampleData = [];
  const today = new Date();
  
  // Generate data for each ticker
  tickers.forEach(ticker => {
    const weight = ticker.Weight || 0.2;
    let price = 100; // Starting price
    
    // Generate 6 months of daily data
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
  
  // Add total portfolio value by date
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

/**
 * Calculate portfolio returns from quotes data
 * @param {Object} quotes - Quotes data
 * @param {Array} tickers - Array of ticker information
 * @param {number} initialAmount - Initial investment amount
 * @returns {Array} Portfolio returns data
 */
export function calculatePortfolioReturns(quotes, tickers, initialAmount) {
  // Validate inputs
  if (!quotes?.Date?.length || !quotes.Ticker || !quotes.Close || !Array.isArray(tickers)) {
    console.error("Invalid input data for portfolio returns calculation");
    return [];
  }
  
  // Process weight data
  const weights = processWeights(tickers);
  
  // Convert columnar data to row format
  const rowData = convertToRowData(quotes);
  
  // Calculate ticker performance
  const { tickerPerformance, tickerFirstLastPrices } = calculateTickerPerformance(
    rowData, weights, initialAmount
  );
  
  // Calculate portfolio totals
  const portfolioTotal = calculatePortfolioTotals(tickerPerformance);
  
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

/**
 * Process ticker weights
 * @param {Array} tickers - Array of ticker information
 * @returns {Object} Processed weights by ticker
 */
export function processWeights(tickers) {
  const weights = {};
  tickers.forEach(d => {
    let weight = d.Weight;
    if (typeof weight === "string") {
      weight = parseFloat(weight.replace("%", "")) / 100;
    }
    weights[d.Ticker] = weight;
  });
  return weights;
}

/**
 * Convert columnar data to row-based format
 * @param {Object} quotes - Quotes data in columnar format
 * @returns {Array} Row-based data
 */
export function convertToRowData(quotes) {
  const rowData = [];
  for (let i = 0; i < quotes.Date.length; i++) {
    rowData.push({
      Date: new Date(quotes.Date[i]),
      Ticker: quotes.Ticker[i],
      Close: quotes.Close[i],
      Type: quotes.Type?.[i] || 'Equity'
    });
  }
  return rowData;
}

/**
 * Calculate performance for each ticker
 * @param {Array} rowData - Row-based data
 * @param {Object} weights - Ticker weights
 * @param {number} initialAmount - Initial investment amount
 * @returns {Object} Ticker performance and price data
 */
export function calculateTickerPerformance(rowData, weights, initialAmount) {
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
    
    // Calculate share count and performance
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
  
  return { tickerPerformance, tickerFirstLastPrices };
}

/**
 * Calculate total portfolio value by date
 * @param {Array} tickerPerformance - Ticker performance data
 * @returns {Array} Portfolio total data
 */
export function calculatePortfolioTotals(tickerPerformance) {
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
  
  return portfolioTotal;
}

/**
 * Create an allocation table for displaying portfolio options
 * @param {Object} dynamicAllocations - Allocation data
 * @param {number} fixed_optimal_weight - Optimal weight
 * @param {number} rf_rate - Risk-free rate
 * @param {number} bond_ret - Bond return
 * @param {number} calc_equity_return - Equity return
 * @param {number} bond_vol - Bond volatility
 * @param {number} calc_equity_std - Equity standard deviation
 * @param {number} corr_eq_bd - Correlation between equity and bonds
 * @returns {HTMLElement} Allocation table
 */