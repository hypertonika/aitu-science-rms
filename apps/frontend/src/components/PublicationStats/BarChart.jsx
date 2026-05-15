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
      className="h-full w-full"
      type="bar"
      height={height}
      series={[{ name: 'Publications', data: series }]}
      options={{
        chart: {
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 600,
          },
        },
        colors: ['#2563eb'],
        xaxis: {
          categories: labels,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: '#64748b', fontSize: '12px' } },
        },
        yaxis: {
          labels: { style: { colors: '#64748b', fontSize: '12px' } },
        },
        grid: {
          borderColor: '#e2e8f0',
          strokeDashArray: 4,
        },
        dataLabels: {
          enabled: true,
          formatter: (val) => `${Math.round((val / (max || total)) * 100)}%`,
          style: { fontSize: '12px', colors: ['#0f172a'] },
          offsetY: -20,
        },
        plotOptions: {
          bar: {
            horizontal: isHorizontal,
            borderRadius: 6,
            columnWidth: '60%',
            dataLabels: { position: 'top' },
          },
        },
        tooltip: {
          theme: 'light',
          y: { formatter: (val) => `${val} publications` },
        },
      }}
    />
  );
}
