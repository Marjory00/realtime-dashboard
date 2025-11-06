from flask import Flask, jsonify, request # Make sure 'request' is imported
from flask_cors import CORS
from data_ingestion import aggregate_data, add_new_sales 
import threading
import time

# --- Synchronization Lock ---
data_lock = threading.Lock()

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# --- API Endpoint (MODIFIED) ---
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    API endpoint to retrieve dashboard data, accepting an optional 'days' parameter.
    """
    # 🚨 FIX: Get 'days' parameter from the URL query string, default to 7
    days_param = request.args.get('days', default=7, type=int)
    days_to_filter = max(1, days_param) 
    
    # Pass the days parameter to the data aggregation function
    data = aggregate_data(data_lock, days_to_filter) 
    
    return jsonify(data)

# ... (rest of the file: continuous_data_update function, thread start, and main block)
if __name__ == '__main__':
    # ...
    app.run(debug=True, use_reloader=False)

# 🛑 ACTION: SAVE this file and RESTART your Flask server now!