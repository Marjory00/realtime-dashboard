import React from 'react';
import { Bar } from 'react-chartjs-2';

const CategorySalesChart = ({ data, title }) => {
    const chartData = { 
        labels: data.labels, 
        datasets: [{ 
            label: 'Revenue by Category', 
            data: data.data, 
            backgroundColor: 'rgba(153, 102, 255, 0.6)', 
            borderColor: 'rgba(153, 102, 255, 1)', 
            borderWidth: 1, 
        }] 
    };
    
    const options = { 
        responsive: true, 
        indexAxis: 'y', 
        plugins: { 
            title: { display: true, text: `Revenue by Product Category (${title})` } 
        }, 
        scales: { 
            x: { beginAtZero: true } 
        } 
    };
    
    return (
        <>
            <h3 style={{ textAlign: 'center', color: '#333', marginTop: 0 }}>Revenue by Category</h3>
            <Bar data={chartData} options={options} />
        </>
    );
};

export default CategorySalesChart;