
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(
    CategoryScale, 
    LinearScale, 
    BarElement, 
    Title, 
    Tooltip, 
    Legend
);

const CategorySalesChart = ({ data, filterTitle }) => {
    
    const chartData = {
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

    const options = {
        responsive: true,
        indexAxis: 'y', // Horizontal Bar Chart
        plugins: {
            title: { display: true, text: `Revenue by Product Category (${filterTitle})` }, 
        },
        scales: {
            x: { beginAtZero: true } 
        }
    };

    return (
        <div className='chart-container'>
            <Bar data={chartData} options={options} />
        </div>
    );
};

export default CategorySalesChart;