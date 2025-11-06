import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import threading 

# --- Global Data Initialization ---
SALES_DATA_DF = pd.DataFrame() 

def generate_data(num_records=50000):
    """
    Generates a DataFrame simulating e-commerce sales transactions 
    for the last 7 days of historical data.
    """
    categories = ['Electronics', 'Apparel', 'Home Goods', 'Books', 'Toys']
    regions = ['North America', 'Europe', 'Asia', 'South America']

    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
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

# --- Data Processing Functions (Requires Lock) ---

def aggregate_data(lock: threading.Lock):
    """
    Processes the raw data into aggregated metrics.
    Acquires the lock for thread-safe reading.
    """
    global SALES_DATA_DF
    
    with lock:
        # Read a copy of the shared data
        df_to_process = SALES_DATA_DF.copy() 
        
    if df_to_process.empty:
        return {
            'daily_sales': {'labels': [], 'data': []},
            'category_metrics': {'labels': [], 'data': []},
            'region_metrics': {'labels': [], 'data': []},
            'total_revenue': 0.0,
            'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

    # 1. Total Sales Trend
    df_daily = df_to_process.set_index('timestamp').resample('D')['sales_amount'].sum().reset_index()
    daily_sales = {
        'labels': df_daily['timestamp'].dt.strftime('%Y-%m-%d').tolist(),
        'data': df_daily['sales_amount'].round(2).tolist()
    }

    # 2. Sales by Category
    category_sales = df_to_process.groupby('category')['sales_amount'].sum().sort_values(ascending=False).round(2)
    category_metrics = {
        'labels': category_sales.index.tolist(),
        'data': category_sales.tolist()
    }

    # 3. Sales by Region
    region_sales = df_to_process.groupby('region')['sales_amount'].sum().sort_values(ascending=False).round(2)
    region_metrics = {
        'labels': region_sales.index.tolist(),
        'data': region_sales.tolist()
    }

    # 4. Total Revenue (KPI)
    total_revenue = df_to_process['sales_amount'].sum().round(2)

    return {
        'daily_sales': daily_sales,
        'category_metrics': category_metrics,
        'region_metrics': region_metrics,
        'total_revenue': total_revenue,
        'last_updated': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }

def add_new_sales(lock: threading.Lock, num_new_records=50):
    """
    Simulates a 'real-time' update by adding new records.
    Acquires the lock for thread-safe writing.
    """
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
        # Append the new data to the main dataset
        SALES_DATA_DF = pd.concat([SALES_DATA_DF, new_df], ignore_index=True)
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Added {num_new_records} new sales records. Total records: {len(SALES_DATA_DF)}")