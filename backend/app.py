from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
# Assuming aggregate_data is updated to return a key named 'all_transactions' 
# containing the full filtered list of transactions.
from data_ingestion import aggregate_data, add_new_sales 
from datetime import datetime
import threading
import time
import pandas as pd
import io # Import io for in-memory CSV creation (good practice, though pandas handles it)

# --- Synchronization Lock ---
data_lock = threading.Lock()

# --- Flask App Initialization ---
app = Flask(__name__)
# Restricting CORS to the frontend port
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}) 

# --- Data Ingestion Thread Function ---
def continuous_data_update():
    """
    Continuously adds new sales data every 5 seconds.
    """
    while True:
        add_new_sales(data_lock)
        time.sleep(5)

# Start the continuous data ingestion thread
data_thread = threading.Thread(target=continuous_data_update, daemon=True)
data_thread.start()


# --- API Endpoint: Dashboard Data Retrieval (Logic is fine) ---
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if start_date_str and end_date_str:
        data = aggregate_data(
            lock=data_lock, 
            start_date_str=start_date_str, 
            end_date_str=end_date_str
        )
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Filtering by Custom Range: {start_date_str} to {end_date_str}")
        
    else:
        days_param = request.args.get('days', default=7, type=int)
        days_to_filter = max(1, days_param) 
        data = aggregate_data(data_lock, days_ago=days_to_filter) 
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Filtering by Days Ago: {days_to_filter}")

    return jsonify(data)


# ----------------------------------------------------------------------
# --- NEW API Endpoint for Data Export (CSV) - FIXES APPLIED ---
# ----------------------------------------------------------------------
@app.route('/api/export-transactions', methods=['GET'])
def export_transactions():
    """
    Exports filtered transaction data as a CSV file.
    Assumes aggregate_data returns the FULL list of filtered transactions 
    under the key 'all_transactions'.
    """
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    # Use the same filtering logic to fetch the data
    if start_date_str and end_date_str:
        data = aggregate_data(
            lock=data_lock, 
            start_date_str=start_date_str, 
            end_date_str=end_date_str
        )
        filename_dates = f"{start_date_str}_to_{end_date_str}"
    else:
        days_param = request.args.get('days', default=7, type=int)
        days_to_filter = max(1, days_param) 
        data = aggregate_data(data_lock, days_ago=days_to_filter) 
        filename_dates = f"last_{days_to_filter}_days"

    # FIX: Use a dedicated key for the full export data. 
    # If your aggregate_data doesn't return this, modify it or create a new ingestion function.
    transactions_for_export = data.get('all_transactions', [])
    
    # FALLBACK: If 'all_transactions' isn't available, we use 'latest_transactions', 
    # but the user will only get the small sample.
    if not transactions_for_export:
        transactions_for_export = data.get('latest_transactions', [])
        
    if not transactions_for_export:
        return "No transactions found in the filtered range to export.", 404
    
    # Use pandas to easily convert the list of dictionaries to CSV
    df = pd.DataFrame(transactions_for_export)
    
    # Select columns to export and rename if necessary
    if 'sales_amount' in df.columns:
        df.rename(columns={'sales_amount': 'amount'}, inplace=True)
        
    # Ensure only relevant columns are exported
    export_columns = [col for col in ['timestamp', 'category', 'region', 'amount', 'transaction_id'] if col in df.columns]

    # 2. Generate CSV String
    csv_buffer = io.StringIO()
    df[export_columns].to_csv(csv_buffer, index=False)
    
    # 3. Create Flask Response for file download
    response = make_response(csv_buffer.getvalue())
    
    # 4. Set the necessary headers for file download
    response.headers["Content-Disposition"] = f"attachment; filename=sales_transactions_{filename_dates}.csv"
    response.headers["Content-type"] = "text/csv"
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Exported {len(transactions_for_export)} records to CSV.")
    return response


# --- Main Block (Logic is fine) ---
if __name__ == '__main__':
    # Use use_reloader=False because the data_thread is running
    app.run(debug=True, use_reloader=False)