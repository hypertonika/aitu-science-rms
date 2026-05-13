import ReactApexChart from 'react-apexcharts';

export default function BarChart({
  series,
  labels,
  max,
  isHorizontal = false,
  height = 300,
}) {
  const total = series.reduce((prev, cur) => prev + cur, 0) || 1;
  return (
    <ReactApexChart
      className='w-full h-full'
      type='bar'
      height={height}
      series={[{ 
        name: 'Публикации',
        data: series 
      }]}
      options={{
        chart: {
          toolbar: {
            show: false
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        colors: ['rgba(33, 150, 243, 0.85)'],
        xaxis: {
          categories: labels,
          axisBorder: {
            show: false
          },
          axisTicks: {
            show: false
          },
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px'
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#64748b',
              fontSize: '12px'
            }
          }
        },
        grid: {
          borderColor: '#f1f5f9',
          strokeDashArray: 4,
          yaxis: {
            lines: {
              show: true
            }
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val) {
            return Math.round((val / (max || total)) * 100) + '%';
          },
          style: {
            fontSize: '12px',
            colors: ['#1e293b']
          },
          offsetY: -20
        },
        plotOptions: {
          bar: {
            horizontal: isHorizontal,
            borderRadius: 6,
            columnWidth: '60%',
            dataLabels: {
              position: 'top'
            },
            hover: {
              filter: {
                type: 'darken',
                value: 0.15
              }
            }
          }
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: function (val) {
              return val + ' публикаций';
            }
          }
        }
      }}
    />
  );
}