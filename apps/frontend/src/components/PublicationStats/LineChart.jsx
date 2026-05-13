import ReactApexChart from "react-apexcharts";

export default function LineChart({
  series,
  seriesName,
  labels,
  height = 300
}) {

//   const total = series.reduce((prev, cur) => prev + cur, 0) || 1;
  return (
    <ReactApexChart
      className="w-full h-full"
      type="line"
      height={height}
      series={[{
        name: seriesName,
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
        colors: ['#2196f3'],
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5,
          colors: ['#fff'],
          strokeColors: '#2196f3',
          strokeWidth: 2,
          hover: {
            size: 7
          }
        },
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
          style: {
            fontSize: '12px',
            colors: ['#1e293b']
          },
          offsetY: -5
        },
        tooltip: {
          theme: 'light',
          y: {
            formatter: function (val) {
              return val + ' публикаций';
            }
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.4,
            inverseColors: false,
            opacityFrom: 0.8,
            opacityTo: 0.2,
            stops: [0, 100]
          }
        }
      }}
    />
  );
}
