import React from 'react';
import { Line } from 'react-chartjs-2';

// Note: ChartJS components are already registered in App.jsx, but best practice 
// would be to ensure they are registered here if this component were used in isolation.

const DailySalesChart = ({ data, title }) => {
    const chartData = { 
        labels: data.labels, 
        datasets: [{ 
            label: 'Daily Revenue', 
            data: data.data, 
            borderColor: 'rgba(75, 192, 192, 1)', 
            backgroundColor: 'rgba(75, 192, 192, 0.5)', 
            tension: 0.3, 
            fill: true, 
        }] 
    };
    
    const options = { 
        responsive: true, 
        plugins: { 
            legend: { position: 'top' }, 
            title: { display: true, text: `Daily Sales Trend (${title})` } 
        } 
    };
    
    return (
        <>
            <h3 style={{ textAlign: 'center', color: '#333', marginTop: 0 }}>Daily Sales Trend</h3>
            <Line data={chartData} options={options} />
        </>
    );
};

export default DailySalesChart;