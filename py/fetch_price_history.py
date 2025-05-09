import os
import re
import time
import random
import logging
import requests
import yfinance as yf
import pandas as pd
import numpy as np
from openbb import obb
from io import StringIO
from datetime import datetime, timedelta, date
from typing import List, Union, Dict, Optional, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm.auto import tqdm

# Configure logging
logging.basicConfig(level=logging.WARNING)
for logger_name in ['yfinance', 'openbb', 'urllib3', 'requests']:
    logging.getLogger(logger_name).setLevel(logging.CRITICAL)

# Filter to block rate limit error messages
class RateLimitFilter(logging.Filter):
    def filter(self, record):
        return not any(msg in record.getMessage() for msg in 
                      ["Too Many Requests", "Rate limited", "No results found"])

# Apply filter to root logger
root_logger = logging.getLogger()
root_logger.addFilter(RateLimitFilter())

# ============================== OPENBB FUNCTIONS ==============================

def fetch_price_history_openbb_single_ticker(
    ticker: str, 
    start_date: Union[datetime, date], 
    end_date: Union[datetime, date], 
    interval: str = '1d', 
    provider: str = 'yfinance'
) -> Optional[Union[pd.DataFrame, Dict[str, Any]]]:
    """
    Fetch historical price data for a single ticker using OpenBB.
    
    Args:
        ticker: Stock ticker symbol
        start_date: Start date for data retrieval
        end_date: End date for data retrieval
        interval: Data frequency ('1d', '1w', '1M', etc.)
        provider: Data provider ('yfinance', 'fmp', etc.)
        
    Returns:
        DataFrame with price data or None/dict with error info if failed
    """
    try:
        # Adjust end_date for monthly interval
        if interval == '1M':
            end_date = end_date.replace(day=1)
            
        # Make API call
        result = obb.equity.price.historical(
            symbol=ticker,
            start_date=start_date.strftime('%Y-%m-%d'),
            end_date=end_date.strftime('%Y-%m-%d'),
            provider=provider,
            adjustment='splits_and_dividends',
            interval=interval
        ).to_dataframe()
        
        if result.empty:
            return None
            
        # Select appropriate price column
        value_column = 'adj_close' if provider.lower() == 'fmp' else 'close'
        
        # Fallback to available column if needed
        if value_column in result.columns:
            df = result[[value_column]]
        elif 'close' in result.columns:
            df = result[['close']]
        else:
            logging.debug(f"Missing price columns for {ticker}. Available: {result.columns.tolist()}")
            return None
            
        df['symbol'] = ticker
        return df
        
    except Exception as e:
        error_msg = str(e).lower()
        if any(msg in error_msg for msg in ["too many requests", "rate limit"]):
            return {'ticker': ticker, 'error': str(e), 'rate_limited': True}
        elif any(msg in error_msg for msg in ["possibly delisted", "no results found"]):
            return None
        else:
            logging.debug(f"Error fetching {ticker}: {e}")
            return {'ticker': ticker, 'error': str(e)}


def fetch_price_history_openbb_fmp(
    tickers: List[str],
    start_date: Union[datetime, date],
    end_date: Union[datetime, date],
    provider: str = 'fmp',
    interval: str = '1d', 
    batch_size: int = 100,
    max_retries: int = 2,
    rate_limit_delay: int = 30
) -> pd.DataFrame:
    """
    Process multiple tickers in batches when using FMP provider with retry logic.
    
    Args:
        tickers: List of stock ticker symbols
        start_date: Start date for data retrieval
        end_date: End date for data retrieval
        provider: Data provider (should be 'fmp')
        interval: Data frequency ('1d', '1w', '1M', etc.)
        batch_size: Number of tickers to process in each batch
        max_retries: Maximum number of retry attempts
        rate_limit_delay: Delay in seconds before retrying after rate limit
        
    Returns:
        DataFrame with price data for all successfully retrieved tickers
    """
    def extract_failed_tickers(error_msg):
        """Extract failed ticker symbols from FMP error message"""
        if "Error fetching data for" in str(error_msg):
            pattern = r"Error fetching data for ([A-Z0-9\.-]+):"
            return re.findall(pattern, str(error_msg))
        return []
    
    all_results = []
    remaining_tickers = tickers.copy()
    
    for retry_count in range(max_retries + 1):
        print(f"Processing attempt {retry_count + 1}/{max_retries + 1}")
        
        # Divide tickers into batches
        batch_groups = [remaining_tickers[i:i+batch_size] 
                       for i in range(0, len(remaining_tickers), batch_size)]
        
        failed_tickers_this_round = []
        
        # Process all batches for this retry round
        for batch in batch_groups:
            try:
                print(f"Fetching batch of {len(batch)} tickers...")
                
                df = obb.equity.price.historical(
                    symbol=batch,
                    start_date=start_date.strftime('%Y-%m-%d'),
                    end_date=end_date.strftime('%Y-%m-%d'),
                    provider=provider,
                    adjustment='splits_and_dividends',
                    interval=interval
                ).to_dataframe()
                
                if not df.empty:
                    # Get appropriate price column
                    value_column = 'adj_close' if provider.lower() == 'fmp' and 'adj_close' in df.columns else 'close'
                    
                    # Pivot to get tickers as columns
                    pivoted_df = df.pivot(columns='symbol', values=value_column)
                    pivoted_df.index.name = 'Date'
                    all_results.append(pivoted_df)
                else:
                    print("Received empty dataframe for batch")
                    
            except Exception as e:
                failed_batch_tickers = extract_failed_tickers(e)
                
                if "Limit Reach" in str(e):
                    if failed_batch_tickers:
                        print(f"Rate limit reached. Identified {len(failed_batch_tickers)} failed tickers")
                        failed_tickers_this_round.extend(failed_batch_tickers)
                    else:
                        print("Rate limit reached. Adding entire batch to retry list")
                        failed_tickers_this_round.extend(batch)
                else:
                    print(f"Error in batch processing: {e}")
                    failed_tickers_this_round.extend(batch)
        
        # After processing all batches, check if we need to retry
        if failed_tickers_this_round and retry_count < max_retries:
            # Only keep truly failed tickers for the next retry
            retrieved_tickers = []
            for result_df in all_results:
                retrieved_tickers.extend(result_df.columns)
            
            remaining_tickers = [t for t in failed_tickers_this_round if t not in retrieved_tickers]
            
            if remaining_tickers:
                print(f"⏳ Round {retry_count + 1} complete with {len(remaining_tickers)} failed tickers")
                print(f"Waiting {rate_limit_delay} seconds before retrying...")
                time.sleep(rate_limit_delay)
            else:
                break  # All tickers processed successfully
        else:
            # Either no failures or max retries reached
            if failed_tickers_this_round:
                print(f"❌ Max retries ({max_retries}) reached. Skipping {len(failed_tickers_this_round)} tickers")
            break
    
    # Combine all batch results
    return pd.concat(all_results, axis=1) if all_results else pd.DataFrame()


def fetch_price_history_openbb(
    tickers: List[str],
    start_date: Union[datetime, date],
    end_date: Union[datetime, date],
    interval: str = '1d',
    max_retries: int = 1,
    provider: str = 'yfinance',
    delay: int = 5,
    rate_limit_delay: int = 30,
    data_file: Optional[str] = None,
    verbose: bool = True
) -> tuple[pd.DataFrame, List[str]]:
    """
    Main function to fetch historical price data for multiple tickers using OpenBB.
    Handles incremental updates and caching to file.
    
    Args:
        tickers: List of stock ticker symbols
        start_date: Start date for data retrieval
        end_date: End date for data retrieval
        interval: Data frequency ('1d', '1w', '1M', etc.)
        max_retries: Maximum number of retry attempts
        provider: Data provider ('yfinance', 'fmp', etc.)
        delay: Delay in seconds between retry attempts
        rate_limit_delay: Delay in seconds before retrying after rate limit
        data_file: Path to save/load cached data
        verbose: Whether to print progress information
        
    Returns:
        Tuple of (DataFrame with price data, List of failed ticker symbols)
    """
    # Standardize date objects
    if interval == '1M':
        end_date = end_date.replace(day=1)

    # Convert dates to datetime for consistent handling
    end_date_for_filtering = end_date
    if isinstance(end_date, date) and not isinstance(end_date, datetime):
        end_date_for_filtering = datetime.combine(end_date, datetime.min.time())
    
    if isinstance(start_date, date) and not isinstance(start_date, datetime):
        start_date = datetime.combine(start_date, datetime.min.time())

    # Initialize variables
    df_existing = None
    max_date = start_date
    failed = []

    # Check for existing data file
    if data_file and os.path.exists(data_file):
        try:
            if verbose:
                print(f"📂 Reading existing data from: {data_file}")
            df_existing = pd.read_csv(data_file)
            df_existing['Date'] = pd.to_datetime(df_existing['Date'])
            df_existing = df_existing.set_index('Date').sort_index()

            existing_tickers = list(df_existing.columns)
            missing_tickers = [t for t in tickers if t not in existing_tickers]

            max_date = df_existing.index.max()
            min_date = df_existing.index.min()

            if verbose:
                print(f"🗓 Existing data: {min_date.date()} to {max_date.date()}")
                print(f"✅ Found {len(existing_tickers)} tickers, ❌ Missing {len(missing_tickers)} tickers")

            need_update = max_date.date() < end_date.date() or bool(missing_tickers)
        except Exception as e:
            if verbose:
                print(f"⚠️ Error reading existing file: {e}")
            need_update = True
            df_existing = None
            missing_tickers = tickers
            min_date = start_date
    else:
        need_update = True
        missing_tickers = tickers
        min_date = start_date

    # Fetch data if needed
    if need_update:
        if verbose:
            print(f"⏳ Fetching data using provider: {provider}...")
            if missing_tickers:
                print(f"Will fetch {len(missing_tickers)} missing tickers from {min_date.date()} to {end_date.date()}")
            if max_date.date() < end_date.date():
                print(f"Will update existing tickers from {(max_date + pd.Timedelta(days=1)).date()} to {end_date.date()}")

        # Use batch processing for FMP provider
        if provider.lower() == 'fmp':
            if verbose:
                print(f"Using FMP batch processing for {len(tickers)} tickers")
                
            # Process missing tickers from min_date
            if missing_tickers:
                if verbose:
                    print(f"Fetching history for {len(missing_tickers)} missing tickers...")
                
                df_missing = fetch_price_history_openbb_fmp(
                    missing_tickers, min_date, end_date, provider, interval,
                    max_retries=max_retries, rate_limit_delay=rate_limit_delay
                )
                
                if not df_missing.empty and verbose:
                    print(f"Retrieved data for {len(df_missing.columns)} of {len(missing_tickers)} missing tickers")
            else:
                df_missing = pd.DataFrame()
                
            # Process existing tickers that need updates
            update_tickers = [t for t in tickers if t not in missing_tickers]
            if update_tickers and max_date.date() < end_date.date():
                if verbose:
                    print(f"Updating {len(update_tickers)} existing tickers...")
                    
                df_updates = fetch_price_history_openbb_fmp(
                    update_tickers, max_date + pd.Timedelta(days=1), end_date,
                    provider, interval, max_retries=max_retries, rate_limit_delay=rate_limit_delay
                )
                
                if not df_updates.empty and verbose:
                    print(f"Updated data for {len(df_updates.columns)} tickers")
            else:
                df_updates = pd.DataFrame()
            
            # Combine missing and updated data
            if not df_missing.empty or not df_updates.empty:
                # Combine new data
                if not df_missing.empty and not df_updates.empty:
                    df_new = pd.concat([df_missing, df_updates], axis=1)
                else:
                    df_new = df_missing if not df_missing.empty else df_updates
                
                # Remove duplicate columns if any
                df_new = df_new.loc[:, ~df_new.columns.duplicated()]
                
                # Merge with existing data if available
                if df_existing is not None:
                    df_combined = df_existing.combine_first(df_new)
                else:
                    df_combined = df_new
                
                # Sort indices for cleaner display
                df_combined = df_combined.sort_index().sort_index(axis=1)
                
                # Ensure datetime index and filter by end date
                df_combined.index = pd.to_datetime(df_combined.index)
                df_combined = df_combined[df_combined.index <= pd.Timestamp(end_date_for_filtering)]
                
                # Identify failed tickers
                retrieved_tickers = list(df_combined.columns)
                failed = [t for t in tickers if t not in retrieved_tickers]
            else:
                df_combined = df_existing if df_existing is not None else pd.DataFrame()
                failed = tickers if df_existing is None else []
                
            if data_file and not df_combined.empty:
                df_combined.to_csv(data_file)
                if verbose:
                    print(f"💾 Saved updated data to {data_file}")
                    
            return df_combined, failed
        
        # Standard approach for other providers (yfinance, etc.)
        else:
            all_dfs = []
            existing_tickers = [t for t in tickers if t in (df_existing.columns if df_existing is not None else [])]
            missing_tickers = [t for t in tickers if t not in existing_tickers]

            for attempt in range(max_retries + 1):
                if verbose:
                    print(f"\n--- Attempt {attempt + 1} ---")
                current_failed = []
                rate_limited_tickers = []

                with ThreadPoolExecutor() as executor:
                    futures = {}
                    
                    # For existing tickers, fetch only missing dates
                    if max_date.date() < end_date.date():  # Only if updates needed
                        for t in existing_tickers:
                            futures[executor.submit(
                                fetch_price_history_openbb_single_ticker,
                                t, max_date + pd.Timedelta(days=1), end_date, interval, provider
                            )] = t
                    
                    # For missing tickers, fetch full date range
                    for t in missing_tickers:
                        futures[executor.submit(
                            fetch_price_history_openbb_single_ticker,
                            t, min_date, end_date, interval, provider
                        )] = t

                    # Process results as they complete
                    for future in as_completed(futures):
                        ticker = futures[future]
                        result = future.result()
                        
                        if isinstance(result, dict) and 'error' in result:
                            if result.get('rate_limited', False):
                                rate_limited_tickers.append(ticker)
                            else:
                                current_failed.append(ticker)
                        else:
                            all_dfs.append(result)

                # Handle rate limited tickers
                if rate_limited_tickers:
                    if verbose:
                        print(f"⏳ Waiting due to rate limits... ({len(rate_limited_tickers)} tickers)")
                    time.sleep(rate_limit_delay)
                    
                    for ticker in rate_limited_tickers:
                        try:
                            # Use appropriate start date depending on ticker status
                            ticker_start = (
                                min_date if ticker in missing_tickers 
                                else max_date + pd.Timedelta(days=1) if max_date.date() < end_date.date() 
                                else end_date
                            )
                            
                            result = fetch_price_history_openbb_single_ticker(
                                ticker, ticker_start, end_date, interval, provider
                            )
                            if isinstance(result, dict) and 'error' in result:
                                if not result.get('rate_limited', False):
                                    current_failed.append(ticker)
                            else:
                                all_dfs.append(result)
                            time.sleep(random.uniform(2, 5))
                        except Exception:
                            current_failed.append(ticker)
                
                # Check if we need to continue retrying
                if not current_failed:
                    break

                if verbose and current_failed:
                    print(f"Retrying {len(current_failed)} failed tickers after {delay} seconds...")
                
                tickers = current_failed
                failed = current_failed
                time.sleep(delay)

            # Process valid results
            valid_dfs = [df for df in all_dfs if isinstance(df, pd.DataFrame)]

            if valid_dfs:
                # Determine price column from provider
                price_column = 'adj_close' if provider.lower() == 'fmp' else 'close'
                
                # Verify column exists in sample data
                sample_df = valid_dfs[0]
                if price_column not in sample_df.columns and 'close' in sample_df.columns:
                    price_column = 'close'
                
                # Combine and process dataframes
                df_new = pd.concat(valid_dfs)
                df_new.index = pd.to_datetime(df_new.index)
                df_new = df_new.pivot(columns='symbol', values=price_column)
                df_new.index.name = 'Date'

                # Merge with existing data if available
                if df_existing is not None:
                    df_combined = df_existing.combine_first(df_new)
                    df_combined = df_combined.sort_index().sort_index(axis=1)
                else:
                    df_combined = df_new.sort_index().sort_index(axis=1)

                # Ensure datetime index and filter by end date
                df_combined.index = pd.to_datetime(df_combined.index)
                df_combined = df_combined[df_combined.index <= pd.Timestamp(end_date_for_filtering)]
            else:
                df_combined = df_existing if df_existing is not None else pd.DataFrame()

            # Save to file if specified
            if data_file and not df_combined.empty:
                df_combined.to_csv(data_file)
                if verbose:
                    print(f"💾 Saved updated data to {data_file}")
        
            return df_combined, failed
    
    else:
        if verbose:
            print("✅ Data is already up-to-date and complete")
        return df_existing, failed


# ============================== YAHOO FINANCE SCRAPING ==============================

def _scrape_single_ticker(
    ticker: str, 
    frequency: str, 
    start_timestamp: int, 
    end_timestamp: int, 
    max_retries: int, 
    session: requests.Session
) -> Optional[pd.DataFrame]:
    """
    Helper function to scrape price history for a single ticker from Yahoo Finance.
    
    Args:
        ticker: Stock ticker symbol
        frequency: Data frequency ('1d', '1wk', '1mo', etc.)
        start_timestamp: Start date as Unix timestamp
        end_timestamp: End date as Unix timestamp
        max_retries: Maximum number of retry attempts
        session: Requests session object for connection reuse
        
    Returns:
        DataFrame with historical price data or raises Exception on failure
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    }
    
    url = f"https://finance.yahoo.com/quote/{ticker}/history/?frequency={frequency}&period1={start_timestamp}&period2={end_timestamp}"
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                time.sleep(random.uniform(2, 5))
                
            response = session.get(url, headers=headers)
            response.raise_for_status()
            
            # Extract table from HTML
            tables = pd.read_html(StringIO(response.text))
            history_df = next((table for table in tables 
                              if 'Date' in table.columns and 
                              any("Close" in str(col) for col in table.columns)), None)
            
            if history_df is None:
                raise ValueError("Could not find historical data table in the HTML")
            
            history_df['Date'] = pd.to_datetime(history_df['Date'])
            return history_df
            
        except Exception as e:
            print(f"{ticker} - Error on attempt {attempt+1}/{max_retries}: {e}")
            if attempt == max_retries - 1:
                raise
                
    raise Exception(f"Failed to retrieve data for {ticker} after {max_retries} attempts")


def scrape_yahoo_finance_history_html(
    tickers: Union[str, List[str]],
    start_timestamp: int,
    end_timestamp: int,
    frequency: str = "1mo",
    max_retries: int = 2,
    max_workers: int = 10
) -> tuple[pd.DataFrame, List[str]]:
    """
    Scrape historical stock data from Yahoo Finance by parsing HTML tables.
    
    Args:
        tickers: Stock ticker symbol or list of symbols
        start_timestamp: Start date as Unix timestamp
        end_timestamp: End date as Unix timestamp
        frequency: Data frequency ('1d', '1wk', '1mo', etc.)
        max_retries: Maximum number of retry attempts
        max_workers: Maximum number of concurrent workers
        
    Returns:
        Tuple of (DataFrame with price data, List of failed ticker symbols)
    """
    if isinstance(tickers, str):
        tickers = [tickers]
    
    all_data = []
    failed_tickers = []
    session = requests.Session()
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_ticker = {
            executor.submit(_scrape_single_ticker, ticker, frequency, start_timestamp, 
                           end_timestamp, max_retries, session): ticker 
            for ticker in tickers
        }
        
        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            try:
                df = future.result()
                if df is not None and not df.empty:
                    df['Ticker'] = ticker
                    all_data.append(df)
                    print(f"Successfully scraped data for {ticker}")
                else:
                    print(f"No data found for {ticker}")
                    failed_tickers.append(ticker)
            except Exception as e:
                print(f"Failed to scrape {ticker}: {str(e)}")
                failed_tickers.append(ticker)
    
    if not all_data:
        return pd.DataFrame(), failed_tickers
    
    # Process and organize the results
    combined_df = pd.concat(all_data, ignore_index=True)
    
    # Select relevant columns
    adj_close_cols = [col for col in combined_df.columns if 'adj close' in col.lower()]
    selected_cols = ['Date', 'Ticker'] + adj_close_cols
    df_selected = combined_df[selected_cols]
    
    # Standardize column names
    df_selected = df_selected.rename(columns=lambda x: "Close" if "adj close" in x.lower() else x)
    
    # Filter out dividend/split rows
    df_filtered = df_selected[~df_selected["Close"].astype(str).str
                            .contains("dividend|split", case=False, na=False)]
    
    # Pivot to standard format
    df_pivot = df_filtered.pivot(index="Date", columns="Ticker", values="Close")
    df_pivot = df_pivot.sort_index()
    
    return df_pivot, failed_tickers


# ============================== YFINANCE API ==============================

def fetch_price_history_yfinance(
    tickers: List[str], 
    start_timestamp: int, 
    end_timestamp: int, 
    max_workers: int = 5
) -> tuple[pd.DataFrame, List[str]]:
    """
    Fetch historical price data for multiple tickers using yfinance API.
    
    Args:
        tickers: List of stock ticker symbols
        start_timestamp: Start date as Unix timestamp
        end_timestamp: End date as Unix timestamp
        max_workers: Maximum number of concurrent workers
        
    Returns:
        Tuple of (DataFrame with price data, List of failed ticker symbols)
    """
    # Convert timestamps to datetime
    start_date = datetime.fromtimestamp(start_timestamp)
    end_date = datetime.fromtimestamp(end_timestamp)
    
    # Remove duplicate tickers
    unique_tickers = list(dict.fromkeys(tickers))
    
    if len(unique_tickers) < len(tickers):
        print(f"Removed {len(tickers) - len(unique_tickers)} duplicate ticker symbols")
        tickers = unique_tickers
    
    print(f"Fetching price history for {len(tickers)} tickers from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    
    failed_tickers = []
    all_data = pd.DataFrame()
    
    # Process tickers in batches
    batch_size = 20
    ticker_batches = [tickers[i:i+batch_size] for i in range(0, len(tickers), batch_size)]
    
    for i, batch in enumerate(ticker_batches):
        print(f"Processing batch {i+1}/{len(ticker_batches)} ({len(batch)} tickers)")
        
        try:
            data = yf.download(
                batch, 
                start=start_date, 
                end=end_date,
                group_by='ticker',
                auto_adjust=False,
                progress=False
            )
            
            # Handle single ticker case (different data structure)
            if len(batch) == 1:
                ticker = batch[0]
                if 'Adj Close' in data.columns and not data['Adj Close'].empty:
                    ticker_df = pd.DataFrame({ticker: data['Adj Close']})
                    all_data = all_data.combine_first(ticker_df) if not all_data.empty else ticker_df
                else:
                    failed_tickers.append(ticker)
                    print(f"No data available for {ticker}")
            else:
                # Handle multi-ticker case
                for ticker in batch:
                    if (ticker, 'Adj Close') in data.columns:
                        ticker_data = data[(ticker, 'Adj Close')]
                        
                        if ticker_data.isna().all():
                            failed_tickers.append(ticker)
                            print(f"No data available for {ticker}")
                            continue
                        
                        ticker_df = pd.DataFrame({ticker: ticker_data})
                        all_data = all_data.combine_first(ticker_df) if not all_data.empty else ticker_df
                    else:
                        failed_tickers.append(ticker)
                        print(f"No data available for {ticker}")
            
        except Exception as e:
            print(f"Error downloading batch: {str(e)}")
            failed_tickers.extend(batch)
        
        # Add delay between batches
        if i < len(ticker_batches) - 1:
            time.sleep(2)
    
    if failed_tickers:
        print(f"\n{len(failed_tickers)} tickers failed to download:")
        print(", ".join(failed_tickers))
    
    print(f"Successfully downloaded {len(all_data.columns)} out of {len(tickers)} tickers")
    
    return all_data, failed_tickers