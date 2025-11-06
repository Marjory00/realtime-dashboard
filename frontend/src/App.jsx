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
// Define the export URL based on the API URL
const EXPORT_URL = API_URL.replace('/dashboard-data', '/export-transactions');


// --- Helper Components (KPICard and TransactionsTable remain unchanged) ---

const KPICard = ({ title, value, unit = '', color = '#007bff' }) => (
    <div className="kpi-card-style" style={{ border: `1px solid ${color}` }}>
        <p style={{ color: '#666' }}>{title}</p>
        <h2 style={{ color: color }}>
            {unit}{value.toLocaleString()}
        </h2>
    </div>
);

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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [isCustomRange, setIsCustomRange] = useState(false); 

    // --- State Management and Data Fetching (Logic remains correct) ---
    const fetchData = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}?`;
            
            if (isCustomRange && startDate && endDate) {
                url += `start_date=${startDate}&end_date=${endDate}`;
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
        fetchData(); 
        const intervalId = setInterval(() => { fetchData(); }, 10000); 
        return () => clearInterval(intervalId);
    }, [filterDays, startDate, endDate, isCustomRange]); 

    const handleDaysChange = (e) => {
        const days = parseInt(e.target.value);
        setFilterDays(days);
        setStartDate('');
        setEndDate('');
        setIsCustomRange(false);
    };
    
    const handleApplyRange = () => {
        if (!startDate || !endDate) {
            alert("Please select both a start and end date.");
            return;
        }
        setIsCustomRange(true);
        setFilterDays(-1); 
    }

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (endDate && new Date(newStartDate) > new Date(endDate)) {
            setEndDate('');
        }
    };
    
    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        setEndDate(newEndDate);
        if (startDate && new Date(newEndDate) < new Date(startDate)) {
            setStartDate('');
        }
    };

    // FIX 1: The handleExport logic is correct but relies on the Flask API working
    const handleExport = () => {
        let exportUrl = EXPORT_URL;
        
        if (isCustomRange && startDate && endDate) {
            exportUrl += `?start_date=${startDate}&end_date=${endDate}`;
        } else {
            exportUrl += `?days=${filterDays}`;
        }

        // Trigger the browser to download the file from the Flask endpoint
        window.location.href = exportUrl;
    };


    if (loading || !data) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
                <h1 className="loading-text">Loading Dashboard Data...</h1>
            </div>
        );
    }
    
    if (error) {
        return <h1 style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>Error: {error}</h1>;
    }

    // --- Calculated KPIs and Filter Title (Unchanged) ---
    const totalTransactions = data?.total_transactions || 0; 
    const avgSaleAmount = totalTransactions > 0 ? (data.total_revenue / totalTransactions) : 0;
    
    const revenuePerHour = data?.revenue_per_hour || 0;
    let rphStatusColor = '#17a2b8'; 

    if (revenuePerHour < 2000) {
        rphStatusColor = '#dc3545';
    } else if (revenuePerHour < 5000) {
        rphStatusColor = '#ffc107';
    } else {
        rphStatusColor = '#28a745';
    }
    
    const currentFilterTitle = isCustomRange
        ? `${startDate} to ${endDate}`
        : `Last ${filterDays === 1 ? '24 Hours' : `${filterDays} Days`}`;

    // --- Chart Data Configuration (Unchanged) ---
    const dailySalesData = { /* ... */ labels: data.daily_sales.labels, datasets: [{ label: 'Daily Revenue', data: data.daily_sales.data, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.5)', tension: 0.3, fill: true, }] };
    const dailySalesOptions = { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: `Daily Sales Trend (${currentFilterTitle})` } } };
    const regionalSalesData = { /* ... */ labels: data.region_metrics.labels, datasets: [{ label: 'Sales by Region', data: data.region_metrics.data, backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'], hoverOffset: 4, }] };
    const categorySalesData = { /* ... */ labels: data.category_metrics.labels, datasets: [{ label: 'Revenue by Category', data: data.category_metrics.data, backgroundColor: 'rgba(153, 102, 255, 0.6)', borderColor: 'rgba(153, 102, 255, 1)', borderWidth: 1, }] };
    const categorySalesOptions = { responsive: true, indexAxis: 'y', plugins: { title: { display: true, text: `Revenue by Product Category (${currentFilterTitle})` } }, scales: { x: { beginAtZero: true } } };


    // --- Dashboard Layout ---
    return (
        <div className='App'>
            
            <header className='dashboard-header'>
                <h1 style={{ color: '#333' }}>Realtime Sales Dashboard</h1>
                <p style={{ margin: '5px 0 15px 0', fontSize: '0.9em', color: '#666' }}>
                    Data Stream Status: Active | Last Update: {data.last_updated}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                    
                    {/* Preset Days Filter Dropdown (Unchanged) */}
                    <div className='filter-controls'>
                        <label>View Data For:</label>
                        <select 
                            value={isCustomRange ? -1 : filterDays} 
                            onChange={handleDaysChange}
                        >
                            <option value={-1} disabled={!isCustomRange}>Custom Range Active</option>
                            <option value={1}>Last 24 Hours</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 90 Days</option>
                        </select>
                    </div>

                    {/* Custom Date Picker Controls (Unchanged, but inline styles are still there for inputs/buttons) */}
                    <div className='filter-controls'>
                        <label>Custom Date Range:</label>
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={handleStartDateChange} 
                            max={new Date().toISOString().split('T')[0]} 
                            style={{ marginRight: '5px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={handleEndDateChange} 
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
                    
                    {/* FIX 2: Export Button now uses a class instead of inline styles */}
                    <button 
                        onClick={handleExport} 
                        className='export-button'
                    >
                        ⬇️ Export Data ({currentFilterTitle})
                    </button>
                </div>
            </header>
            
            {/* KPI Grid (Unchanged) */}
            <div className='kpi-grid'>
                <KPICard title={`Total Revenue (${currentFilterTitle})`} value={data.total_revenue.toFixed(2)} unit="$" color="#007bff" />
                <KPICard title={`Total Transactions (${currentFilterTitle})`} value={totalTransactions} color="#28a745" />
                <KPICard title="Avg. Sale Amount" value={avgSaleAmount.toFixed(2)} unit="$" color="#ffc107" />
                <KPICard title={`Avg. Revenue per Hour`} value={revenuePerHour.toFixed(2)} unit="$" color={rphStatusColor} />
            </div>
            
            {/* Chart Grid (Unchanged) */}
            <div className='chart-grid'>
                <div className='chart-container'><Line data={dailySalesData} options={dailySalesOptions} /></div>
                <div className='chart-container'><Bar data={categorySalesData} options={categorySalesOptions} /></div>
                <div className='chart-container doughnut-container'>
                    <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>Sales Distribution by Region ({currentFilterTitle})</h3>
                    <div className='doughnut-chart-wrapper'> 
                        <Doughnut data={regionalSalesData} />
                    </div>
                </div>
                <div className='chart-container' style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#333' }}>System Status</h3>
                    <p>Frontend (Vite): Active on 5173</p>
                    <p>Backend (Flask): Active on 5000</p>
                    <p style={{ color: 'green', fontWeight: 'bold' }}>All services functional!</p>
                </div>
            </div>

            {/* Transactions Table Component (Unchanged) */}
            <TransactionsTable transactions={data.latest_transactions || []} />

        </div>
    );
}

export default App;