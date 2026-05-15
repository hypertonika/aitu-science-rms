import ReactApexChart from "react-apexcharts";

export default function LineChart({
  series,
  seriesName,
  labels,
  height = 300
}) {
  return (
    <ReactApexChart
      className="h-full w-full"
      type="line"
      height={height}
      series={[{ name: seriesName, data: series }]}
      options={{
        chart: {
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: "easeinout",
            speed: 600,
          },
        },
        colors: ["#0891b2"],
        stroke: {
          curve: "smooth",
          width: 3,
        },
        markers: {
          size: 5,
          colors: ["#fff"],
          strokeColors: "#0891b2",
          strokeWidth: 2,
        },
        xaxis: {
          categories: labels,
          axisBorder: { show: false },
          axisTicks: { show: false },
          labels: { style: { colors: "#64748b", fontSize: "12px" } },
        },
        yaxis: {
          labels: { style: { colors: "#64748b", fontSize: "12px" } },
        },
        grid: {
          borderColor: "#e2e8f0",
          strokeDashArray: 4,
        },
        dataLabels: {
          enabled: true,
          style: { fontSize: "12px", colors: ["#0f172a"] },
          offsetY: -5,
        },
        tooltip: {
          theme: "light",
          y: { formatter: (val) => `${val} publications` },
        },
      }}
    />
  );
}
