from flask import Flask, jsonify, request # Make sure 'request' is imported
from flask_cors import CORS
from data_ingestion import aggregate_data, add_new_sales 
from datetime import datetime
import threading
import time

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
    # Use time.sleep instead of threading.Timer for simplicity in continuous loops
    while True:
        add_new_sales(data_lock)
        time.sleep(5)

# Start the continuous data ingestion thread
data_thread = threading.Thread(target=continuous_data_update, daemon=True)
data_thread.start()


# --- API Endpoint (MODIFIED to handle Custom Dates) ---
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    API endpoint to retrieve dashboard data, prioritizing a custom date range 
    (start_date, end_date) over the 'days' parameter.
    """
    
    # Check for Custom Date Range parameters first
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if start_date_str and end_date_str:
        # Custom Date Range is provided: pass both dates
        data = aggregate_data(
            lock=data_lock, 
            start_date_str=start_date_str, 
            end_date_str=end_date_str
        )
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Filtering by Custom Range: {start_date_str} to {end_date_str}")
        
    else:
        # Fallback to Predefined Days Filter: get 'days' parameter, default to 7
        days_param = request.args.get('days', default=7, type=int)
        days_to_filter = max(1, days_param) 
        
        # Pass the days parameter
        data = aggregate_data(data_lock, days_ago=days_to_filter) 
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Filtering by Days Ago: {days_to_filter}")

    return jsonify(data)

# --- Main Block ---
if __name__ == '__main__':
    # Use use_reloader=False because the data_thread is running
    app.run(debug=True, use_reloader=False)