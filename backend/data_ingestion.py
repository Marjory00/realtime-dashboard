import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import threading 

# --- Global Data Initialization ---
SALES_DATA_DF = pd.DataFrame() 

def generate_data(num_records=50000):
    """
    Generates a DataFrame simulating e-commerce sales transactions 
    for the last 90 days of historical data. (Increased history for date range testing)
    """
    categories = ['Electronics', 'Apparel', 'Home Goods', 'Books', 'Toys']
    regions = ['North America', 'Europe', 'Asia', 'South America']

    end_time = datetime.now()
    start_time = end_time - timedelta(days=90) # 🚨 UPDATED to 90 days
    timestamps = pd.to_datetime(np.random.uniform(start_time.timestamp(), end_time.timestamp(), num_records), unit='s')

    data = {
        'timestamp': timestamps,
        'product_id': np.random.randint(10000, 99999, num_records),
        'category': np.random.choice(categories, num_records, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
        'region': np.random.choice(regions, num_records, p=[0.4, 0.3, 0.2, 0.1]),
        'sales_amount': np.random.uniform(10, 500, num_records).round(2)
    }

    df = pd.DataFrame(data)
    df = df.sort_values(by='timestamp').reset_index(drop=True)
    return df

# Initialize the global DataFrame
SALES_DATA_DF = generate_data()

# --- Data Processing Functions ---

# 🚨 UPDATED FUNCTION SIGNATURE to accept custom dates
def aggregate_data(lock: threading.Lock, days_ago: int = 7, start_date_str: str = None, end_date_str: str = None):
    """
    Processes the raw data into aggregated metrics, filtering by a custom date range 
    (if provided) or by 'days_ago', normalizing daily sales, and providing a sample 
    of the latest transactions.
    """
    global SALES_DATA_DF
    
    # 🚨 NEW: Logic to determine the filtering timeframe
    if start_date_str and end_date_str:
        # Custom Date Range Filter
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            # Add 23:59:59 to the end date to include the entire last day
            end_time_filter = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1) 
            
            # Calculate days_count for KPI normalization and label generation
            time_difference = end_time_filter - start_date
            days_count = time_difference.days + 1
            
            # Define filter conditions
            df_filter_condition = (SALES_DATA_DF['timestamp'] >= start_date) & (SALES_DATA_DF['timestamp'] <= end_time_filter)

        except ValueError:
            # Fallback to default if date strings are invalid
            print("Invalid date format, falling back to 7 days.")
            days_count = 7
            cutoff_time = datetime.now() - timedelta(days=days_count)
            df_filter_condition = SALES_DATA_DF['timestamp'] >= cutoff_time
            start_date = cutoff_time
            end_time_filter = datetime.now() # Use now for hours calculation
    else:
        # Predefined Days Filter (Default)
        days_count = days_ago
        cutoff_time = datetime.now() - timedelta(days=days_count)
        df_filter_condition = SALES_DATA_DF['timestamp'] >= cutoff_time
        start_date = cutoff_time
        end_time_filter = datetime.now() # Use now for hours calculation

    # 1. Thread-safe reading and filtering
    with lock:
        # Filter the DataFrame based on the determined condition
        df_filtered = SALES_DATA_DF[df_filter_condition].copy() 
        
    # --- Handle Empty Data Case ---
    if df_filtered.empty:
        # Use the correct date range for labels if dates were provided
        if start_date_str and end_date_str:
            start_date_for_labels = start_date.date()
            end_date_for_labels = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date_for_labels = datetime.now().date()
            start_date_for_labels = end_date_for_labels - timedelta(days=days_count - 1)
            
        date_range = pd.date_range(start=start_date_for_labels, end=end_date_for_labels, freq='D')
        labels = date_range.strftime('%b %d').tolist()
        
        return {
            'daily_sales': {'labels': labels, 'data': [0.0] * len(labels)},
            'category_metrics': {'labels': [], 'data': []},
            'region_metrics': {'labels': [], 'data': []},
            'total_revenue': 0.0,
            'total_transactions': 0,
            'revenue_per_hour': 0.0, 
            'latest_transactions': [], 
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    # 2. Aggregation and Normalization
    
    # Total Sales Trend (Aggregated by Day & Normalized)
    df_daily = df_filtered.set_index('timestamp').resample('D')['sales_amount'].sum()
    
    # Define the exact date range for the normalization index
    if start_date_str and end_date_str:
        # Index runs from user-provided start date to user-provided end date
        start_date_index = start_date.date()
        end_date_index = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    else:
        # Index runs from (now - days_ago) to today's date
        end_date_index = datetime.now().date()
        start_date_index = end_date_index - timedelta(days=days_count - 1)
        
    full_range_index = pd.date_range(start=start_date_index, end=end_date_index, freq='D')
    df_normalized = df_daily.reindex(full_range_index, fill_value=0)

    daily_sales = {
        'labels': df_normalized.index.strftime('%b %d').tolist(), 
        'data': df_normalized.round(2).tolist()
    }

    # 3. Aggregate Other Metrics (Unchanged)
    category_sales = df_filtered.groupby('category')['sales_amount'].sum().sort_values(ascending=False).round(2)
    category_metrics = {
        'labels': category_sales.index.tolist(),
        'data': category_sales.tolist()
    }

    region_sales = df_filtered.groupby('region')['sales_amount'].sum().sort_values(ascending=False).round(2)
    region_metrics = {
        'labels': region_sales.index.tolist(),
        'data': region_sales.tolist()
    }

    # 4. KPI Calculation
    total_revenue = df_filtered['sales_amount'].sum().round(2)
    total_transactions = len(df_filtered)
    
    # 🚨 UPDATED: Calculate total hours based on the actual time difference for accuracy
    time_delta = end_time_filter - start_date
    total_hours = time_delta.total_seconds() / 3600
    
    # Ensure total_hours is never zero
    total_hours = total_hours if total_hours > 0 else 1 
    
    revenue_per_hour = (total_revenue / total_hours).round(2)

    # 5. Latest Transactions (Unchanged sampling logic)
    df_latest = df_filtered.sort_values(by='timestamp', ascending=False).head(15)
    
    latest_transactions = df_latest.assign(
        timestamp=df_latest['timestamp'].dt.strftime('%H:%M:%S %b %d')
    )[['timestamp', 'category', 'region', 'sales_amount']].to_dict('records')

    return {
        'daily_sales': daily_sales,
        'category_metrics': category_metrics,
        'region_metrics': region_metrics,
        'total_revenue': total_revenue,
        'total_transactions': total_transactions, 
        'revenue_per_hour': revenue_per_hour, 
        'latest_transactions': latest_transactions, 
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

def add_new_sales(lock: threading.Lock, num_new_records=50):
    # (Unchanged real-time data ingestion function)
    global SALES_DATA_DF

    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    
    categories = ['Electronics', 'Apparel', 'Home Goods', 'Books', 'Toys']
    regions = ['North America', 'Europe', 'Asia', 'South America']
    timestamps = pd.to_datetime(np.random.uniform(start_time.timestamp(), end_time.timestamp(), num_new_records), unit='s')

    new_data = {
        'timestamp': timestamps,
        'product_id': np.random.randint(10000, 99999, num_new_records),
        'category': np.random.choice(categories, num_new_records, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
        'region': np.random.choice(regions, num_new_records, p=[0.4, 0.3, 0.2, 0.1]),
        'sales_amount': np.random.uniform(10, 500, num_new_records).round(2)
    }

    new_df = pd.DataFrame(new_data).sort_values(by='timestamp')
    
    with lock:
        SALES_DATA_DF = pd.concat([SALES_DATA_DF, new_df], ignore_index=True)
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Added {num_new_records} new sales records. Total records: {len(SALES_DATA_DF)}")