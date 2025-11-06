import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Doughnut, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// Register ALL Chart.js components we need
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

// URL for the Flask API endpoint
const API_URL = 'http://localhost:5000/api/dashboard-data';

// --- Main App Component ---

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await axios.get(API_URL);
      setData(response.data);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching data from Flask API:', err);
      setError("Failed to fetch data. Ensure Flask server is running on port 5000.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
    const intervalId = setInterval(fetchData, 10000); 
    return () => clearInterval(intervalId);
  }, []);

  if (loading) {
    return <h1 style={{ color: '#007bff' }}>Loading Dashboard Data...</h1>;
  }
  
  if (error) {
    return <h1 style={{ color: 'red' }}>Error: {error}</h1>;
  }

  // --- Chart Data Configuration ---

  // 1. Daily Sales Line Chart Data
  const dailySalesData = {
    labels: data.daily_sales.labels, 
    datasets: [
      {
        label: 'Daily Revenue',
        data: data.daily_sales.data, 
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const dailySalesOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Daily Sales Trend (Last 7 Days)' },
    },
  };

  // 2. Regional Sales Doughnut Chart Data
  const regionalSalesData = {
    labels: data.region_metrics.labels, 
    datasets: [
      {
        label: 'Sales by Region',
        data: data.region_metrics.data, 
        backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'],
        hoverOffset: 4,
      },
    ],
  };
  
  // 3. Category Sales Bar Chart Data
  const categorySalesData = {
    labels: data.category_metrics.labels,
    datasets: [
      {
        label: 'Revenue by Category',
        data: data.category_metrics.data,
        backgroundColor: 'rgba(153, 102, 255, 0.6)', // Purple
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categorySalesOptions = {
    responsive: true,
    // 🚨 FIX: Make the Bar Chart Horizontal
    indexAxis: 'y', 
    plugins: {
        title: { display: true, text: 'Revenue by Product Category' },
    },
    scales: {
        x: { beginAtZero: true } // Use 'x' scale for beginAtZero in horizontal chart
    }
  };

  // --- Dashboard Layout ---
  return (
    <div className='App' style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Header and KPI */}
      <header style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#333' }}>Realtime Sales Dashboard</h1>
        <div style={{ padding: '10px', backgroundColor: '#e9f7ff', borderRadius: '5px' }}>
            <h2 style={{ color: '#007bff', margin: '0 0 5px 0' }}>Total Revenue: ${data.total_revenue.toLocaleString()}</h2>
            <p style={{ margin: 0, fontSize: '0.9em' }}>Last Data Update: **{data.last_updated}** (Polling every 10s)</p>
        </div>
      </header>
      
      {/* Chart Grid - Now 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* ROW 1: Daily Sales Line Chart */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Line data={dailySalesData} options={dailySalesOptions} />
        </div>
        
        {/* ROW 1: Category Sales Bar Chart (Horizontal) */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Bar data={categorySalesData} options={categorySalesOptions} />
        </div>
        
        {/* ROW 2: Regional Sales Doughnut Chart (RESIZED) */}
        <div style={{ 
            padding: '20px', 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            // 🚨 FIX: Constrain maximum height and center content
            maxHeight: '450px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
        }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Sales Distribution by Region</h3>
            <div style={{ width: '80%', height: '80%' }}> 
                <Doughnut data={regionalSalesData} />
            </div>
        </div>

        {/* ROW 2: Placeholder / Log */}
        <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ color: '#333' }}>System Status</h3>
            <p>Frontend (Vite): Active on 5173</p>
            <p>Backend (Flask): Active on 5000</p>
            <p style={{ color: 'green' }}>All services functional!</p>
        </div>
      </div>

    </div>
  );
}

export default App;