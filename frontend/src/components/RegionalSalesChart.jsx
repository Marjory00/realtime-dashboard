import React from 'react';
import { Doughnut } from 'react-chartjs-2';

const RegionalSalesChart = ({ data, title }) => {
    const chartData = { 
        labels: data.labels, 
        datasets: [{ 
            label: 'Sales by Region', 
            data: data.data, 
            backgroundColor: ['rgba(255, 99, 132, 0.6)', 'rgba(54, 162, 235, 0.6)', 'rgba(255, 206, 86, 0.6)', 'rgba(75, 192, 192, 0.6)'], 
            hoverOffset: 4, 
        }] 
    };
    
    const options = { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'right' }
        }
    };
    
    return (
        <>
            <h3 style={{ textAlign: 'center', color: '#333', marginBottom: '15px' }}>Sales Distribution by Region ({title})</h3>
            <div style={{ maxHeight: '300px' }}>
                 <Doughnut data={chartData} options={options} />
            </div>
        </>
    );
};

export default RegionalSalesChart;