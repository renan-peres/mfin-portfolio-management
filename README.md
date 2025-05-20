<h1 align="center">
  <a href="https://portfolio-management.renanperes.com/">
    <img src="https://res.cloudinary.com/dqtnflaeh/image/upload/v1747739085/thumbnails/portfolio_construction_banner_vvtifc.png" alt="Banner">
  </a>
</h1>

This repository contains a comprehensive portfolio construction and management system designed for optimal asset allocation based on a client's risk tolerance, fundamental analysis, risk-adjusted returns, and market conditions. It provides end-to-end functionality from security selection to performance tracking and return projections.

## Features
- Equity Portfolio Construction using fundamental screening + Modern Portfolio Theory  
- Bond Portfolio Construction using Modified Duration and Convexity to determine price sensitivity to interest rate changes  
- Benchmark Selection using Regression Analysis  
- Index/CAPM Modeling for systematic risk assessment
- Capital Allocation Model with Maximum Utility  
- Arbitrage Pricing Theory (APT) for multi-factor modeling
- Option Pricing Models for derivatives evaluation
- Interactive dashboard for portfolio visualization and management
- Fee impact analysis with multiple fee structure comparisons
- Return projections with uncertainty bounds

## 1. Core Components
### **Notebooks**: Sequential analysis and modeling workflows  
  - [01_equity_portfolio_construction.ipynb](01_equity_portfolio_construction.ipynb): Security screening and portfolio optimization  
  - [02_bond_portfolio_contruction.ipynb](02_bond_portfolio_contruction.ipynb): Fixed income allocation strategies  
  - [03_benchmark_selection.ipynb](03_benchmark_selection.ipynb): Regression-based benchmark identification  
  - [04_capm_index_model.ipynb](04_capm_index_model.ipynb): Systematic risk analysis  
  - [05_capital_allocation_utility.ipynb](05_capital_allocation_utility.ipynb): Utility maximization strategies
  - [06_arbitrage_pricing_theory.ipynb](06_arbitrage_pricing_theory.ipynb): Multi-factor risk modeling
  - [07_option_pricing_models.ipynb](07_option_pricing_models.ipynb): Derivatives valuation

### **Python Utilities** ([`py/`](py/)):  
  - [benchmark_regression.py](py/benchmark_regression.py): Implements benchmark selection algorithms
  - [bond_selection.py](py/bond_selection.py): Fixed income security evaluation tools
  - [fetch_fundamentals.py](py/fetch_fundamentals.py): Financial statement data acquisition
  - [optimal_portfolio.py](py/optimal_portfolio.py): Efficient frontier calculators
  - [portfolio_var_simulation.py](py/portfolio_var_simulation.py): Monte Carlo risk analysis
  - [quantstats_fix.py](py/quantstats_fix.py): Patches for QuantStats library compatibility
  - [utils.py](py/utils.py): Common utility functions used across notebooks

### **Reports** ([`reports/`](reports/)):  
  - [01_benchmark_comparison_quantstats.ipynb](reports/01_benchmark_comparison_quantstats.ipynb): Performance comparison reporting
  - Portfolio tracking Excel files (e.g., [`portfolio-2025-04-26.xlsx`](reports/portfolio-2025-04-26.xlsx))
  - Portfolio analysis HTML reports (e.g., [`portfolio_vs_benchmark-2025-04-26.html`](reports/portfolio_vs_benchmark-2025-04-26.html))

## 2. Data Infrastructure
### **Data Processing** ([`data/loaders/`](data/loaders)):  
  - [`scrape_tickers.ipynb`](data/loaders/scrape_tickers.ipynb): Updates ticker lists from market sources
  - [`scrape_quotes.ipynb`](data/loaders/scrape_quotes.ipynb): Fetches current price data
  - [`scrape_fundamentals.ipynb`](data/loaders/scrape_fundamentals.ipynb): Extracts financial statement data
  - [`fetch_datasets.ipynb`](data/fetch_datasets.ipynb): Merges separate data sources into unified datasets
  - [`duckdb_fetch_database.sh`](data/loaders/duckdb_fetch_database.sh): Imports all CSV files into DuckDB tables with automated table naming and schema detection
  - [`data.db`](data/data.db): DuckDB database for efficient querying of portfolio data

### **Data Storage and Management** ([`data/`](data/)):
  - Datasets containing CSV files for different asset classes ([`data/datasets/`](data/datasets)):
    - [`daily_stock_quotes.csv`](data/datasets/daily_stock_quotes.csv): Equity price data
    - [`daily_bond_quotes.csv`](data/datasets/daily_bond_quotes.csv): Fixed income price data
    - [`daily_benchmark_quotes.csv`](data/datasets/daily_benchmark_quotes.csv): Benchmark/ETF securities price data
  - Ticker lists for different asset classes:
    - [`tickers_sp_500.txt`](data/tickers_sp_500.txt): S&P 500 constituents
    - [`tickers_bond.txt`](data/tickers_bond.txt): Fixed income securities
    - [`tickers_treasury.txt`](data/tickers_treasury.txt): Treasury securities
    - [`tickers_benchmark.txt`](data/tickers_benchmark.txt): Benchmark/ETFs 
    - [`tickers_index.txt`](data/tickers_index.txt): Market indices

## 3. Workflow Automation
- **Daily Pipeline** ([`daily_pipeline.sh`](pipelines/daily_pipeline.sh)):
  - Environment setup with dependency checks (Python, Jupyter, DuckDB)
  - Automated data collection process:
    1. Scrapes current ticker lists from market sources
    2. Fetches latest price data for all securities
    3. Consolidates separate data sources into unified datasets
    4. Imports updated data into DuckDB for efficient querying
  - Error handling with detailed logging
  - Designed for daily market data updates without full portfolio reconstruction

- **Weekly Pipeline** ([`weekly_pipeline.sh`](pipelines/weekly_pipeline.sh)):
  - Complete end-to-end portfolio management process:
    1. Fetches fundamental data for security screening
    2. Reconstructs equity portfolio using optimization models
    3. Updates bond portfolio allocation with current interest rate data
    4. Performs benchmark regression analysis for tracking
    5. Runs CAPM modeling for systematic risk assessment
    6. Generates comprehensive performance reports with QuantStats
    7. Updates portfolio tracking files with latest allocations
    8. Refreshes historical data sets
    9. Rebuilds Quarto dashboard with latest portfolio data
  - Portfolio file management with versioned backups
  - Designed for weekly portfolio rebalancing and comprehensive reporting

## 4. [Dashboard](https://portfolio-management.renanperes.com/)
### **Dashboard Files** ([`dashboard/`](dashboard/)):
  - [`00_setup.qmd`](dashboard/00_setup.qmd): Data loading, initialization, and global constants
  - [`01_sidebar.qmd`](dashboard/01_sidebar.qmd): Interactive control panel with sliders for risk tolerance and allocation
  - [`02_cover.qmd`](dashboard/02_cover.qmd): Landing page with project summary and navigation
  - [`03_complete_portfolio.qmd`](dashboard/03_complete_portfolio.qmd): Full portfolio view with interactive tabs
  - [`04_capital_allocation.qmd`](dashboard/04_capital_allocation.qmd): Capital allocation model visualization
  - [`05_asset_class_allocation.qmd`](dashboard/05_asset_class_allocation.qmd): Asset class breakdown with efficient frontier
  - [`06_security_allocation.qmd`](dashboard/06_security_allocation.qmd): Individual security analysis
  - [`07_data.qmd`](dashboard/07_data.qmd): Raw data tables with filtering capabilities
  - [`index.qmd`](dashboard/index.qmd): Dashboard configuration and layout definition

### **Technical Components**:
  - **CSS Styling** ([`dashboard/css/`](dashboard/css)): Custom styles for charts, tables, sidebar, and responsive design
  - **JavaScript Modules** ([`dashboard/js/`](dashboard/js)): Interactive chart rendering, data processing, and utility functions
  - **Interactive Plots** ([`dashboard/plotly/`](dashboard/plotlyjs)): Dynamic visualizations with hover effects, click interactions, and real-time updates

### **Features in Detail**
- **Efficient Frontier Calculation**:
  - Quadratic optimization for optimal risk-return tradeoff
  - Interactive visualization allowing exploration of portfolio options
  - Capital market line integration with risk-free asset
- **Portfolio Construction**:
  - Maximum Sharpe ratio portfolio identification with risk-adjusted returns
  - Minimum variance portfolio for risk-averse scenarios
  - Equal-weight portfolios for comparison benchmarking
- **Capital Allocation**:
  - Optimal allocation between risky and risk-free assets based on risk tolerance
  - Utility maximization based on client risk aversion parameter
  - Target volatility portfolios with risk budgeting

### **Performance Analysis**
- **Return Metrics**:
  - Historical holding period returns (HPR) with interactive date range selection
  - Annualized internal rate of return (IRR) calculations
  - Time-weighted vs. money-weighted return comparisons
- **Risk Assessment**:
  - Volatility analysis with rolling window calculations
  - Drawdown analysis with peak-to-trough visualization
  - Sharpe, Sortino, and Calmar ratios for risk-adjusted performance
- **Component Analysis**:
  - Asset class contribution analysis with attribution metrics
  - Security-level performance tracking with weight impact
  - Correlation heatmaps for diversification assessment

### **Projection Capabilities**
- **Return Modeling**:
  - Expected return projections with compounding visualization
  - Monte Carlo simulations with probability distributions
  - Uncertainty bounds showing confidence intervals
- **Fee Impact Analysis**:
  - Comprehensive comparison of various fee structures:
    - Front-load fees (initial investment charge)
    - Annual management fees (percentage of assets)
    - Back-load fees (exit or redemption charges)
    - Performance-based fees with high-water marks
  - Opportunity cost calculation showing long-term fee impact
  - Interactive sliders for fee scenario testing
- **Scenario Testing**:
  - Bull/bear market scenario analysis
  - Stress testing with historical crisis event simulations
  - Retirement planning with withdrawal rate analysis

## 6. Getting Started

```bash
# Clone the repository
git clone https://github.com/renan-peres/mfin-portfolio-management.git
cd mfin-portfolio-management

# Install Astral UV (for reproducible venvs)
curl -LsSf https://astral.sh/uv/install.sh | env INSTALLER_NO_MODIFY_PATH=1 sh
uv venv                                 # or: python3 -m venv .venv
source .venv/bin/activate               # or: source venv/bin/activate 

# Install dependencies
uv pip install -r requirements.txt 

# Run a full portfolio update
bash pipelines/weekly_pipeline.sh

# Launch the dashboard (requires Quarto)
quarto preview dashboard/index.qmd
```

## References
- [Tidy Finance: Modern Portfolio Theory](https://www.tidy-finance.org/python/modern-portfolio-theory.html)
- [Tidy Finance: The Capital Asset Pricing Model](https://www.tidy-finance.org/python/capital-asset-pricing-model.html)
- [Tidy Finance: Parametric Portfolio Policies](https://www.tidy-finance.org/python/parametric-portfolio-policies.html)
- [Portfolio Optimization with Python and R](https://kenwuyang.com/posts/2021_09_15_portfolio_optimization_with_python_and_r_modern_portfolio_theory/#efficient-frontier)  
- [Portfolio Strategies by Shashank Vemuri](https://github.com/shashankvemuri/Finance/tree/master/portfolio_strategies)  
- [Algorithmic Portfolio Optimization by Kevin Vecmanis](https://kevinvecmanis.io/finance/optimization/2019/04/02/Algorithmic-Portfolio-Optimization.html)  
- [Algorithmic Trading in Python by Nick McCullum](https://github.com/nickmccullum/algorithmic-trading-python)