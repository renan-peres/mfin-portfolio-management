# Data manipulation libraries
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List


def calculate_bond_price(ytm, maturity, coupon_rate, face_value=100, frequency=2):
    """
    Calculate the present value (price) of a bond.
    
    Parameters:
    -----------
    ytm : float
        Yield to maturity as a decimal (e.g., 0.05 for 5%)
    maturity : float
        Time to maturity in years
    coupon_rate : float
        Annual coupon rate as a decimal (e.g., 0.04 for 4%)
    face_value : float, default=100
        Par value of the bond
    frequency : int, default=2
        Number of coupon payments per year (2 for semi-annual)
        
    Returns:
    --------
    float
        Bond price
    """
    # Calculate periods and rates
    periods = maturity * frequency
    rate_per_period = ytm / frequency
    coupon_per_period = coupon_rate * face_value / frequency
    
    # Calculate present value of coupon payments
    coupon_pv = coupon_per_period * ((1 - (1 + rate_per_period) ** -periods) / rate_per_period)
    
    # Calculate present value of face value (principal)
    principal_pv = face_value / ((1 + rate_per_period) ** periods)
    
    # Total bond price is sum of both present values
    bond_price = coupon_pv + principal_pv
    
    return bond_price

# Apply the function to the DataFrame
def add_bond_prices_to_df(df):
    df['Bond_Price'] = df.apply(
        lambda row: calculate_bond_price(
            ytm=row['Yield_To_Maturity'],
            maturity=row['Weighted_Avg_Maturity'],
            coupon_rate=row['Weighted_Avg_Coupon'],
            face_value=100,
            frequency=2
        ) if pd.notna(row['Yield_To_Maturity']) and 
             pd.notna(row['Weighted_Avg_Maturity']) and 
             pd.notna(row['Weighted_Avg_Coupon']) else np.nan,
        axis=1
    )
    return df.round(3)

def calculate_modified_duration(settlement_date, maturity_date, coupon_rate, ytm, frequency):
    total_years = (maturity_date - settlement_date).days / 365
    num_periods = int(total_years * frequency)
    face_value, coupon_payment = 100, coupon_rate * 100 / frequency
    cash_flows = np.full(num_periods, coupon_payment)
    cash_flows[-1] += face_value
    times = np.arange(1, num_periods + 1) / frequency
    discounted_cash_flows = cash_flows / (1 + ytm / frequency) ** times
    macaulay_duration = (times * discounted_cash_flows).sum() / discounted_cash_flows.sum()
    return macaulay_duration / (1 + ytm / frequency)

def calculate_duration_for_bonds(df, end_date):
    df['Duration (D*)'] = df.apply(lambda row: calculate_modified_duration(
        end_date,
        end_date + timedelta(days=int(row['Weighted_Avg_Maturity'] * 365)),
        row['Weighted_Avg_Coupon'], row['Yield_To_Maturity'], 2
    ) if pd.notna(row['Yield_To_Maturity']) and pd.notna(row['Weighted_Avg_Coupon']) and pd.notna(row['Weighted_Avg_Maturity']) else np.nan, axis=1)
    return df.round(3)

def calculate_price_change_sensitivity(df, rate_change=-0.01):
    """
    Calculate Price Sensitivity to YTM (-1%) using Duration (D*) and Convexity.
    
    Parameters:
    - df: DataFrame containing 'Duration (D*)' and 'Convexity' columns.
    - rate_change: Change in interest rates (default is -1% or -0.01).
    
    Returns:
    - Updated DataFrame with 'Price Sensitivity to YTM (-1%)' column.
    """
    df['Price Sensitivity to YTM (-1%)'] = df.apply(
        lambda row: row['Duration (D*)'] + 0.5 * row['Convexity'] * (rate_change ** 2)
        if pd.notna(row['Duration (D*)']) and pd.notna(row['Convexity']) else np.nan,
        axis=1
    ) / 100
    return df.round(4)