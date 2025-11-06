import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; 

// Import the separated chart components
import DailySalesChart from './components/DailySalesChart.jsx'; 
import RegionalSalesChart from './components/RegionalSalesChart.jsx';
import CategorySalesChart from './components/CategorySalesChart.jsx'; 

// Register ALL Chart.js components we need 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

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
const EXPORT_URL = API_URL.replace('/dashboard-data', '/export-transactions');


// --- Helper Components ---

const KPICard = ({ title, value, unit = '', color = '#007bff' }) => (
    <div className="kpi-card-style" style={{ border: `1px solid ${color}` }}>
        <p style={{ color: '#666' }}>{title}</p>
        <h2 style={{ color: color }}>
            {unit}{value.toLocaleString()}
        </h2>
    </div>
);

const TransactionsTable = ({ transactions, searchTerm, handleSearchChange }) => {
    
    // Client-side filtering logic
    const filteredTransactions = transactions.filter(t => {
        const term = searchTerm.toLowerCase();
        // Search by category, region, or timestamp/sales_amount
        return (
            t.category.toLowerCase().includes(term) ||
            t.region.toLowerCase().includes(term) ||
            t.timestamp.toLowerCase().includes(term) ||
            t.sales_amount.toString().includes(term)
        );
    });

    const transactionsToDisplay = filteredTransactions.slice(0, 15);

    return (
        <div className='transactions-table-container'>
            <div className='transactions-header'>
                <h3 style={{ color: '#333', marginTop: '0' }}>
                    Latest Transactions ({transactionsToDisplay.length} of {filteredTransactions.length} filtered)
                </h3>
                
                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Search category, region, or amount..."
                    className="transactions-search-input"
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
            </div>
            
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
                    {transactionsToDisplay.map((t, index) => (
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
            
            {filteredTransactions.length === 0 && (
                <p style={{ textAlign: 'center', color: '#6c757d' }}>No recent transactions found matching the current filter/search.</p>
            )}
        </div>
    );
};

// --- Main App Component ---

function App() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [filterDays, setFilterDays] = useState(7); 
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isCustomRange, setIsCustomRange] = useState(false); 

    const [searchTerm, setSearchTerm] = useState('');

    // --- State Management and Data Fetching ---
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
    }, [filterDays, startDate, endDate, isCustomRange]); 
    
    useEffect(() => {
        const intervalId = setInterval(() => { fetchData(); }, 10000); 
        return () => clearInterval(intervalId);
    }, []); 

    // --- Filter Handlers ---
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
    
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleExport = () => {
        let exportUrl = EXPORT_URL;
        
        if (isCustomRange && startDate && endDate) {
            exportUrl += `?start_date=${startDate}&end_date=${endDate}`;
        } else {
            exportUrl += `?days=${filterDays}`;
        }

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

    const totalTransactions = data?.total_transactions || 0; 
    const avgSaleAmount = totalTransactions > 0 ? (data.total_revenue / totalTransactions) : 0;
    
    const revenuePerHour = data?.revenue_per_hour || 0;
    let rphStatusColor = (revenuePerHour < 2000) ? '#dc3545' : (revenuePerHour < 5000) ? '#ffc107' : '#28a745';
    
    const currentFilterTitle = isCustomRange
        ? `${startDate} to ${endDate}`
        : `Last ${filterDays === 1 ? '24 Hours' : `${filterDays} Days`}`;
        
    const chartProps = { 
        currentFilterTitle: currentFilterTitle,
        dailySalesData: data.daily_sales,
        regionalSalesData: data.region_metrics,
        categorySalesData: data.category_metrics,
    };
    
    // --- Dashboard Layout ---
    return (
        <div className='App'>
            
            <header className='dashboard-header'>
                <h1 style={{ color: '#333' }}>Realtime Sales Dashboard</h1>
                <p style={{ margin: '5px 0 15px 0', fontSize: '0.9em', color: '#666' }}>
                    Data Stream Status: Active | Last Update: {data.last_updated}
                </p>
                
                {/* ➡️ FIX: Filter Controls and EXPORT BUTTON restored here */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                    
                    {/* Preset Days Filter Dropdown */}
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

                    {/* Custom Date Picker Controls */}
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
                    
                    {/* EXPORT BUTTON */}
                    <button 
                        onClick={handleExport} 
                        className='export-button'
                    >
                        ⬇️ Export Data ({currentFilterTitle})
                    </button>
                </div>
                {/* ⬅️ END FIX */}
            </header>
            
            {/* KPI Grid */}
            <div className='kpi-grid'>
                <KPICard title={`Total Revenue (${currentFilterTitle})`} value={data.total_revenue.toFixed(2)} unit="$" color="#007bff" />
                <KPICard title={`Total Transactions (${currentFilterTitle})`} value={totalTransactions} color="#28a745" />
                <KPICard title="Avg. Sale Amount" value={avgSaleAmount.toFixed(2)} unit="$" color="#ffc107" />
                <KPICard title={`Avg. Revenue per Hour`} value={revenuePerHour.toFixed(2)} unit="$" color={rphStatusColor} />
            </div>
            
            {/* Chart Grid - Using Modular Components */}
            <div className='chart-grid'>
                <div className='chart-container'>
                    <DailySalesChart data={chartProps.dailySalesData} title={chartProps.currentFilterTitle} />
                </div>
                
                <div className='chart-container doughnut-container'>
                    <RegionalSalesChart data={chartProps.regionalSalesData} title={chartProps.currentFilterTitle} />
                </div>
                
                <div className='chart-container'><CategorySalesChart data={chartProps.categorySalesData} title={chartProps.currentFilterTitle} /></div>
                
                <div className='chart-container' style={{ textAlign: 'center' }}>
                    <h3 style={{ color: '#333' }}>System Status</h3>
                    <p>Frontend (Vite): Active on 5173</p>
                    <p>Backend (Flask): Active on 5000</p>
                    <p style={{ color: 'green', fontWeight: 'bold' }}>All services functional!</p>
                </div>
            </div>

            {/* Transactions Table Component */}
            <TransactionsTable 
                transactions={data.latest_transactions || []} 
                searchTerm={searchTerm} 
                handleSearchChange={handleSearchChange} 
            />

        </div>
    );
}

export default App;