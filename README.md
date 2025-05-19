# Investment Portfolio Construction

## Overview
This repository contains portfolio construction models designed for optimal asset allocation based on a client's risk tolerance, assets' fundamental screening and risk-adjusted returns, maximum Sharpe ratio for the portfolio, and the overall market conditions.

## Features
- Equity Portfolio Construction using fundamental screening + modern portfolio theory  
- Bond Portfolio Construction using Modified Duration and Convexity  
- Benchmark Selection using Regression Analysis  
- Index/CAPM Modeling  
- Capital Allocation Model with Maximum Utility  
- Arbitrage Pricing Theory (APT) for multi-factor modeling  

## 1. Core Components
- **Notebooks**: Sequential analysis and modeling workflows  
  - [01_equity_portfolio_construction.ipynb](01_equity_portfolio_construction.ipynb)  
  - [02_bond_portfolio_contruction.ipynb](02_bond_portfolio_contruction.ipynb)  
  - [03_benchmark_selection.ipynb](03_benchmark_selection.ipynb)  
  - [04_capm_index_model.ipynb](04_capm_index_model.ipynb)  
  - [05_capital_allocation_utility.ipynb](05_capital_allocation_utility.ipynb)  

- **Python Utilities** (in `py/`):  
  - [quantstats_fix.py](py/quantstats_fix.py): Patches for QuantStats library (resampling fixes, HTML-report enhancements)

## 2. Data Infrastructure
- **Data Fetching** (in `data/loaders/`):  
  - [`fetch_price_history.py`](data/loaders/fetch_price_history.py): Yahoo Finance data scraping  
  - Other scrapers: ticker & fundamentals notebooks  

- **Database Operations**:  
  - [`duckdb_fetch_database.sh`](data/loaders/duckdb_fetch_database.sh): CSV → DuckDB import  

## 3. Workflow Automation
- **Pipelines** (in `pipelines/`):  
  - [`daily_pipeline.sh`](pipelines/daily_pipeline.sh): End-to-end run of notebooks & reports  
  - [`weekly_pipeline.sh`](pipelines/weekly_pipeline.sh): Scheduled notebook execution  

## 4. Utilities & Fixes
- **QuantStats Compatibility**:  
  - [`py/quantstats_fix.py`](py/quantstats_fix.py):  
    - Fixes resampling bugs  
    - Adds download button & removes attribution in generated HTML  

## 5. Interactive Dashboards (Quarto)
- **Dashboard Files** (in `dashboard/`):  
  - [`index.qmd`](dashboard/index.qmd): Main dashboard layout & OJS glue  
  - [`00_sidebar.qmd`](dashboard/00_sidebar.qmd): Input controls & summary cards  
  - [`01_complete_portfolio.qmd`](dashboard/01_complete_portfolio.qmd): Complete-portfolio view  
  - [`02_capital_allocation.qmd`](dashboard/02_capital_allocation.qmd): Capital allocation & CML  
  - [`03_asset_class_allocation.qmd`](dashboard/03_asset_class_allocation.qmd): Asset-class breakdown  
  - [`04_security_allocation.qmd`](dashboard/04_security_allocation.qmd): Security-level view  
  - [`05_data.qmd`](dashboard/05_data.qmd): Data tables & downloads  

- **JavaScript Utilities** (in `dashboard/js/`):  
  - [`portfolio-utils.js`](dashboard/js/portfolio-utils.js): Portfolio calculations & sliders  
  - [`dashboard.js`](dashboard/js/dashboard.js): Interactive charting logic  

## 6. Getting Started

```bash
# Clone the repository
git clone https://github.com/renan-peres/mfin-portfolio-management.git
cd mfin-portfolio-management

# Install Astral UV (for reproducible venvs)
curl -LsSf https://astral.sh/uv/install.sh | env INSTALLER_NO_MODIFY_PATH=1 sh
uv venv       # or: python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
```

## References
- [Tidy Finance: Modern Portfolio Theory](https://www.tidy-finance.org/python/modern-portfolio-theory.html)
- [Tidy Finance: The Capital Asset Pricing Model](https://www.tidy-finance.org/python/capital-asset-pricing-model.html)
- [Tidy Finance: Parametric Portfolio Policies](https://www.tidy-finance.org/python/parametric-portfolio-policies.html)
- [Portfolio Optimization with Python and R](https://kenwuyang.com/posts/2021_09_15_portfolio_optimization_with_python_and_r_modern_portfolio_theory/#efficient-frontier)  
- [Portfolio Strategies by Shashank Vemuri](https://github.com/shashankvemuri/Finance/tree/master/portfolio_strategies)  
- [Algorithmic Portfolio Optimization by Kevin Vecmanis](https://kevinvecmanis.io/finance/optimization/2019/04/02/Algorithmic-Portfolio-Optimization.html)  
- [Algorithmic Trading in Python by Nick McCullum](https://github.com/nickmccullum/algorithmic-trading-python)
