from flask import Flask, jsonify
from flask_cors import CORS # type: ignore
from data_ingestion import aggregate_data, add_new_sales
import threading
import time

# --- Flask App Initialization ---
app = Flask(__name__)
# Enable CORS to allow the React frontend (running on port 3000) to access the API (port 5000)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- API Endpoint ---
@app.route('/api/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """
    API endpoint to retrieve the processed and aggregated dashboard data.
    """
    data = aggregate_data()
    return jsonify(data)

# --- Real-Time Simulation Thread ---

def continuous_data_update():
    """
    A separate background thread to simulate continuous data ingestion.
    """
    while True:
        # Add a batch of new records every 10 seconds, matching the frontend's polling interval
        add_new_sales(num_new_records=50) 
        time.sleep(10) # Wait for 10 seconds before the next batch

# Start the background thread for data simulation upon server launch
data_thread = threading.Thread(target=continuous_data_update)
data_thread.daemon = True # Daemon threads shut down automatically when the main program exits
data_thread.start()

# --- Main Run Block ---
if __name__ == '__main__':
    # Flask runs on 127.0.0.1:5000 by default
    print("Starting Flask API server on [http://127.0.0.1:5000/](http://127.0.0.1:5000/)")
    # use_reloader=False prevents the background thread from running twice
    app.run(debug=True, use_reloader=False)