import React from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement
);

export default function HomePage({ publications }) {
  // Группировка публикаций по типу
  const publicationsByType = {
    'Scopus/WoS': publications.filter(p => p.publicationType === 'scopus_wos').length,
    'Конференции': publications.filter(p => p.publicationType === 'conference').length,
    'Статьи РК': publications.filter(p => p.publicationType === 'articles').length,
  };

  // Группировка публикаций по годам
  const publicationsByYear = publications.reduce((acc, pub) => {
    const year = pub.year;
    if (!acc[year]) acc[year] = 0;
    acc[year]++;
    return acc;
  }, {});

  // Конфигурация для столбчатой диаграммы
  const barChartData = {
    labels: Object.keys(publicationsByType),
    datasets: [
      {
        data: Object.values(publicationsByType),
        backgroundColor: 'rgba(33, 150, 243, 0.8)',
        borderColor: 'rgba(33, 150, 243, 1)',
        borderWidth: 1,
        borderRadius: 5,
        maxBarThickness: 50,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Конфигурация для линейного графика
  const years = Object.keys(publicationsByYear).sort();
  const lineChartData = {
    labels: years,
    datasets: [
      {
        data: years.map(year => publicationsByYear[year]),
        borderColor: 'rgba(33, 150, 243, 1)',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(33, 150, 243, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Добро пожаловать на главную страницу!
          </h1>
          <p className="mt-2 text-gray-600">
            Вы можете управлять своими публикациями и резюме через навигацию сверху.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mb-8">
          {/* Распределение публикаций по типу */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Распределение публикаций по типу
            </h2>
            <div className="h-[300px] w-full max-w-2xl mx-auto">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Статистика по годам */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Статистика по годам
            </h2>
            <div className="h-[300px] w-full max-w-2xl mx-auto">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 