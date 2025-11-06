import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line, Doughnut, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

import './App.css'; 

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

const API_URL = 'http://localhost:5000/api/dashboard-data';

// --- Helper Components ---

// Component for displaying individual KPI cards
const KPICard = ({ title, value, unit = '', color = '#007bff' }) => (
    <div className="kpi-card-style" style={{ border: `1px solid ${color}` }}>
        <p style={{ color: '#666' }}>{title}</p>
        <h2 style={{ color: color }}>
            {unit}{value.toLocaleString()}
        </h2>
    </div>
);

// Displays the latest transactions in a table
const TransactionsTable = ({ transactions }) => (
    <div className='transactions-table-container'>
        <h3 style={{ color: '#333', marginTop: '0' }}>Latest 15 Transactions</h3>
        <table className="transactions-table">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Category</th>
                    <th>Region</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((t, index) => (
                    <tr key={index}>
                        <td>{t.timestamp}</td>
                        <td>{t.category}</td>
                        <td>{t.region}</td>
                        <td className='amount-positive'>
                            ${t.sales_amount.toFixed(2)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {transactions.length === 0 && (
             <p style={{ textAlign: 'center', color: '#6c757d' }}>No recent transactions found in the filtered range.</p>
        )}
    </div>
);

// --- Main App Component ---

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filterDays, setFilterDays] = useState(7); 
  // NEW STATE FOR CUSTOM DATE RANGE
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      
      let url = `${API_URL}?`;
      
      // NEW: Priority is given to custom dates if both are set and valid
      if (startDate && endDate) {
          url += `start_date=${startDate}&end_date=${endDate}`;
          // Set filterDays to -1 to indicate custom range is active (and prevent days=X from being appended)
          setFilterDays(-1); 
      } else {
          url += `days=${filterDays}`;
      }

      const response = await axios.get(url);
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
    setLoading(true); 
    // Trigger fetchData whenever filterDays, startDate, or endDate changes
    fetchData(); 
    
    const intervalId = setInterval(fetchData, 10000); 
    return () => clearInterval(intervalId);
  }, [filterDays, startDate, endDate]); // Updated dependency array

  // Handler for preset days filter change
  const handleDaysChange = (e) => {
      const days = parseInt(e.target.value);
      setFilterDays(days);
      // Reset custom dates when a preset is selected
      setStartDate('');
      setEndDate('');
  };
  
  // Handler for applying custom range
  const handleApplyRange = () => {
      if (!startDate || !endDate) {
          alert("Please select both a start and end date.");
          return;
      }
      // Setting filterDays to -1 signals that the custom range is active
      setFilterDays(-1); 
      // The state change for startDate/endDate combined with filterDays=-1 will trigger useEffect/fetchData
  }


  if (loading || !data) {
    return <h1 style={{ color: '#007bff', textAlign: 'center', marginTop: '50px' }}>Loading Dashboard Data...</h1>;
  }
  
  if (error) {
    return <h1 style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>Error: {error}</h1>;
  }

  // --- Calculated KPIs (Client-Side) ---
  const totalTransactions = data?.total_transactions || 0; 
  const avgSaleAmount = totalTransactions > 0 ? (data.total_revenue / totalTransactions) : 0;
  
  // Revenue per Hour Metric & Conditional Formatting
  const revenuePerHour = data?.revenue_per_hour || 0;
  let rphStatusColor = '#17a2b8'; 

  if (revenuePerHour < 2000) {
    rphStatusColor = '#dc3545'; // Red (Poor performance)
  } else if (revenuePerHour < 5000) {
    rphStatusColor = '#ffc107'; // Yellow (Needs improvement)
  } else {
    rphStatusColor = '#28a745'; // Green (Excellent)
  }
  
  // Determine filter title based on active filter
  const currentFilterTitle = (startDate && endDate && filterDays === -1) 
      ? `${startDate} to ${endDate}`
      : `Last ${filterDays === 1 ? '24 Hours' : `${filterDays} Days`}`;


  // --- Chart Data Configuration (Unchanged) ---
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
      title: { display: true, text: `Daily Sales Trend (${currentFilterTitle})` }, // Updated Title
    },
  };

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
  
  const categorySalesData = {
    labels: data.category_metrics.labels,
    datasets: [
      {
        label: 'Revenue by Category',
        data: data.category_metrics.data,
        backgroundColor: 'rgba(153, 102, 255, 0.6)', 
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const categorySalesOptions = {
    responsive: true,
    indexAxis: 'y', 
    plugins: {
        title: { display: true, text: `Revenue by Product Category (${currentFilterTitle})` }, // Updated Title
    },
    scales: {
        x: { beginAtZero: true } 
    }
  };

  // --- Dashboard Layout ---
  return (
    <div className='App'>
      
      {/* Header and Filter Controls */}
      <header className='dashboard-header'>
        <h1 style={{ color: '#333' }}>Realtime Sales Dashboard</h1>
        <p style={{ margin: '5px 0 15px 0', fontSize: '0.9em', color: '#666' }}>
            Data Stream Status: Active | Last Update: {data.last_updated}
        </p>
        
        {/* Filter Controls Container */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '15px' }}>
            
            {/* Preset Days Filter Dropdown */}
            <div className='filter-controls'>
                <label>View Data For:</label>
                <select 
                    value={filterDays >= 0 ? filterDays : -1} 
                    onChange={handleDaysChange}
                >
                    <option value={-1} disabled={filterDays !== -1}>Custom Range Active</option>
                    <option value={1}>Last 24 Hours</option>
                    <option value={7}>Last 7 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                </select>
            </div>

            {/* Custom Date Picker Controls */}
            <div className='filter-controls'>
                <label>Custom Date Range:</label>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    max={new Date().toISOString().split('T')[0]} 
                    style={{ marginRight: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate || undefined}
                    max={new Date().toISOString().split('T')[0]} 
                    style={{ marginRight: '10px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button 
                    onClick={handleApplyRange} 
                    style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', backgroundColor: '#007bff', color: '#fff', cursor: 'pointer' }}
                >
                    Apply
                </button>
            </div>
        </div>
      </header>
      
      {/* KPI Grid (Responsive 4-2-1 Column Layout) */}
      <div className='kpi-grid'>
          <KPICard 
              title={`Total Revenue (${currentFilterTitle})`} // Updated Title
              value={data.total_revenue.toFixed(2)} 
              unit="$" 
              color="#007bff" 
          />
          <KPICard 
              title={`Total Transactions (${currentFilterTitle})`} // Updated Title
              value={totalTransactions} 
              color="#28a745" 
          />
          <KPICard 
              title="Avg. Sale Amount" 
              value={avgSaleAmount.toFixed(2)} 
              unit="$" 
              color="#ffc107" 
          />
          <KPICard 
              title={`Avg. Revenue per Hour`} 
              value={revenuePerHour.toFixed(2)} 
              unit="$" 
              color={rphStatusColor} 
          />
      </div>
      
      {/* Chart Grid (Responsive 2-1 Column Layout) */}
      <div className='chart-grid'>
        
        {/* ROW 1: Daily Sales Line Chart */}
        <div className='chart-container'>
          <Line data={dailySalesData} options={dailySalesOptions} />
        </div>
        
        {/* ROW 1: Category Sales Bar Chart (Horizontal) */}
        <div className='chart-container'>
          <Bar data={categorySalesData} options={categorySalesOptions} />
        </div>
        
        {/* ROW 2: Regional Sales Doughnut Chart */}
        <div className='chart-container doughnut-container'>
            <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>Sales Distribution by Region ({currentFilterTitle})</h3>
            <div className='doughnut-chart-wrapper'> 
                <Doughnut data={regionalSalesData} />
            </div>
        </div>

        {/* ROW 2: System Status */}
        <div className='chart-container' style={{ textAlign: 'center' }}>
            <h3 style={{ color: '#333' }}>System Status</h3>
            <p>Frontend (Vite): Active on 5173</p>
            <p>Backend (Flask): Active on 5000</p>
            <p style={{ color: 'green', fontWeight: 'bold' }}>All services functional!</p>
        </div>
      </div>

      {/* Transactions Table Component */}
      <TransactionsTable transactions={data.latest_transactions || []} />

    </div>
  );
}

export default App;