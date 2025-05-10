---
title: Investment Portfolio Construction
toc: true
---

```js
import * as vgplot from "npm:@uwdata/vgplot";
import { DEFAULT_CONFIG, getCustomTableFormat, createCollapsibleSection } from "./components/tableFormatting.js";
import * as htl from "htl";
import * as arrow from "apache-arrow";
import { getDefaultClient } from "observablehq:stdlib/duckdb";
const db = await getDefaultClient();
```

```html
<style>

/* Header and container fixes */
.observablehq article {
  max-width: none !important;
  width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

.observablehq-markdown {
  max-width: none !important;
  width: 100% !important;
  margin: 0 !important;
}

h1, h2, h3, h4, h5, h6, p, li, ul, ol {
  width: 100% !important;
  max-width: none !important;
  margin-right: 0 !important;
  padding-right: 0 !important;
}

</style>
```

# Investment Portfolio Models
## Portfolio Management (Spring 2025)

```js
// Simple date display
const formattedDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric', 
  year: 'numeric'
});

display(html`<div style="font-size: 0.9em; margin-bottom: 10px;">Date: ${formattedDate}</div>`);
```

This interactive report a comprehensive framework for modern portfolio management, implementing theoretical concepts from Modern Portfolio Theory (MPT) and the Capital Asset Pricing Model (CAPM). The analysis spans from high-level asset allocation to security-specific selection, with optimization centered on the Sharpe ratio.
- [Dashboard](#dashboard)
- [Excel Models](#excel-models)
- [Investment Policy Statement](#investment-policy-statement)

---
## Dashboard
The interactive dashboard below provides a holistic view of the portfolio construction process. It demonstrates the systematic application of portfolio theory across multiple dimensions:
- Capital Allocation: Visualizes the optimal allocation between risky assets and risk-free investments based on risk preferences 
- Asset Class Allocation: Applies efficient frontier analysis to determine optimal weights between major asset classes
- Security Selection: Implements quantitative models for security selection within each asset class
- Performance Analysis: Compares portfolio performance against relevant benchmarks

Use the fullscreen button for a more immersive analysis experience.

```js
const investmentPortfolioDashboard = html`
  <div>
    <button 
      style="margin-bottom: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
      onclick=${(e) => {
        const iframe = e.target.parentElement.querySelector('iframe');
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
          iframe.msRequestFullscreen();
        }
      }}>
      Fullscreen
    </button>
    <div style="width: 100%; height: 600x; position: relative;">
    <iframe height=600x width="100%" 
        id="investmentPortfolioDashboard-embed" 
        title="investmentPortfolioDashboard Embed"
        src="https://raw.githack.com/renan-peres/mfin-portfolio-management/refs/heads/main/dashboard/quarto/index.html"
        frameborder="0" allow="clipboard-write" allowfullscreen></iframe>
    </div>
  </div>
`;

display(investmentPortfolioDashboard);
```

---
## Excel Models
This section provides access to the underlying quantitative models driving the portfolio construction process. The spreadsheet includes:

Portfolio optimization calculations based on historical return data Risk metrics including standard deviation, Value at Risk (VaR), and drawdown analysis Asset correlation matrices demonstrating diversification benefits Scenario analysis and stress testing for various market conditions. These models implement the mathematical framework described in academic literature while maintaining practical applicability for real-world investment decisions.

<!-- 
```js
// Spreadsheet embedding
const spreadsheetUrl = "https://1drv.ms/x/c/bde1a904e346bc6a/IQRTEwB280IjSazAjML3PbuuAd4_2bk5zHNh5guP6706TTo?em=2&AllowTyping=True&AllowFormulaEntry=True&ActiveCell='Cover'!A1&wdHideGridlines=True&wdInConfigurator=True&wdShowFormulaBar=True&wdInConfigurator=True";

function embedSpreadsheet(url) {
  if (url.includes('sharepoint.com') || url.includes('1drv.ms')) {
    // Excel online embedding
    return html`
      <div>
        <div style="margin-bottom: 10px;">
          <button 
            style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
            onclick=${(e) => {
              const iframe = e.target.parentElement.parentElement.querySelector('iframe');
              if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
              } else if (iframe.webkitRequestFullscreen) {
                iframe.webkitRequestFullscreen();
              } else if (iframe.msRequestFullscreen) {
                iframe.msRequestFullscreen();
              }
            }}>
            Fullscreen
          </button>
        </div>
        <div style="width: 100%; height: 600px; position: relative;">
          <iframe 
            width="100%" 
            scrolling="no" 
            height="600px" 
            src="${url}" 
            frameborder="0" 
            scrolling="no"
            allowfullscreen
          ></iframe>
          <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 30px; background: white; z-index: 1000;"></div>
        </div>
      </div>`;
  } else if (url.includes('docs.google.com')) {
    // Google Sheets handling remains the same
    return html`<div>Loading Google Sheet data...</div>`;
  } else {
    return html`<div class="alert alert-warning">Unsupported spreadsheet URL format</div>`;
  }
}
// Display the embedded spreadsheet
display(embedSpreadsheet(spreadsheetUrl));
``` 
-->

---
## Investment Policy Statement
The Investment Policy Statement (IPS) establishes the strategic framework for portfolio management, outlining:
- Investment objectives and risk tolerance parameters
- Asset allocation guidelines and rebalancing protocols
- Performance evaluation benchmarks and measurement criteria
- Investment constraints and regulatory considerations

This document serves as the foundational governance framework for all investment activities and ensures alignment between strategies employed and investor objectives.

<!-- ```js
const oneDrivePath = "https://1drv.ms/b/c/bde1a904e346bc6a/EY-k0gdHz5BJms-NY7B5AK8B62B7MKz13IHndFdhL_SZEg";
const embedUrl = `${oneDrivePath}?embed=true`;

display(html`
  <div>
    <button 
      style="margin-bottom: 10px; padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
      onclick=${(e) => {
        const iframe = e.target.parentElement.querySelector('iframe');
        if (iframe.requestFullscreen) {
          iframe.requestFullscreen();
        } else if (iframe.webkitRequestFullscreen) {
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
          iframe.msRequestFullscreen();
        }
      }}>
      Fullscreen
    </button>
    <div style="width: 100%; height: 800px; position: relative;">
      <iframe 
        width="100%" 
        height="800px" 
        src="${embedUrl}"
        frameborder="0"
        allowfullscreen
      ></iframe>
    </div>
  </div>
`);
``` -->