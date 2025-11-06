
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Title, 
    Tooltip, 
    Legend
);

const DailySalesChart = ({ data, filterTitle }) => {
    
    const chartData = {
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

    const options = {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: `Daily Sales Trend (${filterTitle})` }, 
        },
    };

    return (
        <div className='chart-container'>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default DailySalesChart;