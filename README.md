# Investment Portfolio Models

## Overview
This repository contains investment portfolio models designed for optimal asset allocation and performance comparison. It provides tools to optimize investment strategies, analyze risk, and visualize performance.

## Features
- Equity Portfolio Construction using fundamental screening + modern portfolio theory
- Bond Portfolio Construction using Moddified Duration and Convexity
- Benchmark Selection using Regression Analysis 
- Index/CAMP Modeling
- Capital Allocation Model with Maximum Utility
- Arbitrage Pricing Theory (APT) for multi-factor modeling

## 1. Core Components
- **Notebooks**: Sequential analysis and modeling workflows
  - [01_equity_portfolio_construction.ipynb](01_equity_portfolio_construction.ipynb)
  - [02_bond_portfolio_contruction.ipynb](02_bond_portfolio_contruction.ipynb)
  - [03_benchmark_selection.ipynb](03_benchmark_selection.ipynb)
  - [04_index_capm_model.ipynb](04_index_capm_model.ipynb)
  - [05_capital_allocation_utility.ipynb](05_capital_allocation_utility.ipynb)
  - [06_arbitrage_pricing_theory.ipynb](06_arbitrage_pricing_theory.ipynb): 

- **Core Python Modules**:
  - [`optimal_portfolio.py`](optimal_portfolio.py): Efficient frontier generation and portfolio optimization
  - [`benchmark_regression.py`](benchmark_regression.py): Statistical benchmarking tools
  - [`portfolio_var_simulation.py`](portfolio_var_simulation.py): Risk measurement and simulation
  - [`quantstats_fix.py`](py/quantstats_fix.py): Fixes for QuantStats library, including HTML report enhancements

- **JavaScript Utilities**:
  - [`portfolio-utils.js`](dashboard/quarto/js/portfolio-utils.js): Functions for portfolio calculations, asset allocation sliders, and risk-based metrics
  - [`dashboard.js`](dashboard/quarto/js/dashboard.js): Interactive charting and data visualization logic

## 2. Data Infrastructure
- **Data Fetching**: 
  - [`data/loaders/fetch_price_history.py`](data/loaders/fetch_price_history.py): Yahoo Finance data scraping
  - Data tickers and quotes scrapers in [`data/loaders/`](data/loaders/)
  
- **Database Operations**:
  - [`data/loaders/duckdb_fetch_database.sh`](data/loaders/duckdb_fetch_database.sh): CSV to DuckDB import utility

## 3. Workflow Automation
- **Pipeline Orchestration**: 
  - [`pipelines/daily_pipeline.sh`](pipelines/daily_pipeline.sh): End-to-end execution pipeline for data collection and analysis
  - Complete workflow from ticker scraping to benchmark comparison

## 4. Utilities and Fixes
- **Compatibility Tools**:
  - [`quantstats_fix.py`](py/quantstats_fix.py): Patches for QuantStats library to fix resampling issues and CI compatibility
  - HTML report customization with download buttons and attribution removal

## 5. Interactive Dashboards
- **Dashboard Features**:
  - Capital allocation line and efficient frontier visualization
  - Risky and complete portfolio statistics
  - Asset class and security-level allocation
  - Index/benchmark comparison
  - Portfolio performance tracking

- **Dashboard Files**:
  - [`index.qmd`](dashboard/quarto/index.qmd): Main dashboard configuration and layout
  - [`01_capital_allocation_utility.qmd`](dashboard/quarto/01_capital_allocation_utility.qmd): Capital Allocation Line
  - [`02_asset_class_allocation.qmd`](dashboard/quarto/02_asset_class_allocation.qmd): Asset class Allocation and Portfolio Composition
  - [`03_security_allocation.qmd`](dashboard/quarto/03_security_allocation.qmd): Security-level allocation and efficient frontier

## 6. Getting Started
### Installation
```bash
# Clone the repository
git clone https://github.com/renan-peres/mfin-portfolio-management.git
cd mfin-portfolio-management

# Install uv: https://docs.astral.sh/uv/configuration/installer/
curl -LsSf https://astral.sh/uv/install.sh | env INSTALLER_NO_MODIFY_PATH=1 sh
# uv python install --reinstall
# uv pip install ipykernel -U --force-reinstall

# Create virtual environment: https://docs.astral.sh/uv/pip/environments/#creating-a-virtual-environment
uv venv # python3 -m venv venv

# Activate the virtual environment
source .venv/bin/activate # source venv/bin/activate 

# Install dependencies
uv pip install -r requirements.txt --prerelease=allow # pip install -r requirements.txt 
```

## References
- [The Efficient Frontier - Tidy Finance](https://www.tidy-finance.org/python/modern-portfolio-theory.html#the-efficient-frontier)
- [Portfolio Optimization with Python and R: Modern Portfolio Theory](https://kenwuyang.com/posts/2021_09_15_portfolio_optimization_with_python_and_r_modern_portfolio_theory/#efficient-frontier)
- [Portfolio Strategies by Shashank Vemuri](https://github.com/shashankvemuri/Finance/tree/master/portfolio_strategies)
- [Portfolio Optimization using Python and Modern Portfolio Theory by Ryan O'Connel, CFA](https://ryanoconnellfinance.com/python-portfolio-optimization/)
- [Algorithmic Portfolio Optimization in Python by Kevin Vecmanis](https://kevinvecmanis.io/finance/optimization/2019/04/02/Algorithmic-Portfolio-Optimization.html)
- [Algorithmic Trading in Python by Nick McCullum](https://github.com/nickmccullum/algorithmic-trading-python)