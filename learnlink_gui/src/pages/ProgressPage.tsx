import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { FaFilter } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import '../styles/pages/progress.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProgressPage: React.FC = () => {
  // Dummy data for Line Chart 1 - Course Completion Progress
  const lineData1 = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Mathematics',
        data: [20, 35, 45, 60, 75, 85],
        borderColor: '#512da8',
        tension: 0.4,
      },
      {
        label: 'Physics',
        data: [15, 30, 40, 55, 65, 80],
        borderColor: '#ff6b6b',
        tension: 0.4,
      },
    ],
  };

  // Dummy data for Line Chart 2 - Assignment Scores
  const lineData2 = {
    labels: ['Assignment 1', 'Assignment 2', 'Assignment 3', 'Assignment 4', 'Assignment 5'],
    datasets: [
      {
        label: 'Your Score',
        data: [85, 92, 78, 95, 88],
        borderColor: '#20c997',
        tension: 0.4,
      },
      {
        label: 'Class Average',
        data: [75, 80, 72, 85, 78],
        borderColor: '#868e96',
        tension: 0.4,
      },
    ],
  };

  // Dummy data for Bar Chart 1 - Time Spent per Subject
  const barData1 = {
    labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Literature'],
    datasets: [
      {
        label: 'Hours per Week',
        data: [8, 6, 5, 4, 3],
        backgroundColor: '#512da8',
      },
    ],
  };

  // Dummy data for Bar Chart 2 - Quiz Performance
  const barData2 = {
    labels: ['Quiz 1', 'Quiz 2', 'Quiz 3', 'Quiz 4', 'Quiz 5'],
    datasets: [
      {
        label: 'Correct Answers',
        data: [8, 7, 9, 6, 8],
        backgroundColor: '#20c997',
      },
      {
        label: 'Total Questions',
        data: [10, 10, 10, 10, 10],
        backgroundColor: '#e9ecef',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Learning Progress Dashboard</h1>
        <p>Track your academic performance and learning journey with detailed analytics and insights.</p>
      </div>
      
      <div className="charts-grid">
        <div className="chart-container">
          <div className="chart-header">
            <h2>Course Completion Progress</h2>
            <button className="filter-button">
              <FaFilter />
            </button>
          </div>
          <div className="chart-wrapper">
            <Line data={lineData1} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h2>Assignment Performance</h2>
            <button className="filter-button">
              <FaFilter />
            </button>
          </div>
          <div className="chart-wrapper">
            <Line data={lineData2} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h2>Time Spent per Subject</h2>
            <button className="filter-button">
              <FaFilter />
            </button>
          </div>
          <div className="chart-wrapper">
            <Bar data={barData1} options={chartOptions} />
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h2>Quiz Performance Analysis</h2>
            <button className="filter-button">
              <FaFilter />
            </button>
          </div>
          <div className="chart-wrapper">
            <Bar data={barData2} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage; 