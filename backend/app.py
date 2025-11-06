from flask import Flask, jsonify
from flask_cors import CORS
from data_ingestion import aggregate_data, add_new_sales 
import threading
import time

# --- Synchronization Lock ---
# Lock for ensuring only one thread reads or writes to the shared data at a time.
data_lock = threading.Lock()

# --- Flask App Initialization ---
app = Flask(__name__)
# 🚨 IMPORTANT: CORS configured for the Vite frontend port (5173)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# --- API Endpoint ---
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    API endpoint to retrieve the processed dashboard data.
    Passes the lock to aggregate_data for thread-safe reading.
    """
    data = aggregate_data(data_lock)
    return jsonify(data)

# --- Real-Time Simulation Thread ---

def continuous_data_update():
    """
    A separate background thread to simulate continuous data ingestion.
    """
    while True:
        # Pass the lock to add_new_sales for thread-safe writing
        add_new_sales(data_lock, num_new_records=50) 
        time.sleep(10) # Matches the 10-second polling interval in the frontend

# Start the background thread for data simulation upon server launch
data_thread = threading.Thread(target=continuous_data_update)
data_thread.daemon = True # Daemon threads shut down automatically when the main program exits
data_thread.start()

# --- Main Run Block ---
if __name__ == '__main__':
    print("Starting Flask API server on http://127.0.0.1:5000/")
    # use_reloader=False prevents the background thread from running twice
    app.run(debug=True, use_reloader=False)