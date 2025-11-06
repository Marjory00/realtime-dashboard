
import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const RegionalSalesChart = ({ data, filterTitle }) => {
    
    const chartData = {
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

    return (
        <div className='chart-container doughnut-container'>
            <h3 style={{ textAlign: 'center', marginBottom: '15px', color: '#333' }}>
                Sales Distribution by Region ({filterTitle})
            </h3>
            <div className='doughnut-chart-wrapper'> 
                <Doughnut data={chartData} />
            </div>
        </div>
    );
};

export default RegionalSalesChart;