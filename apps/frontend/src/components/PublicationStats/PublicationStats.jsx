import { BarChart3, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicationTypeMap } from "../../constants/publications";
import { makeAuthenticatedRequest } from "../../services/api";
import BarChart from "./BarChart";
import LineChart from "./LineChart";

const url = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PublicationStats({ compact = false }) {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await makeAuthenticatedRequest(
          `${url}/api/user/stats`,
          { method: "GET" },
          navigate
        );

        if (response?.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Stats loading failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const typeKeys = Object.keys(data.types || {});
  const yearKeys = Object.keys(data.years || {}).sort();

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
        <div className="h-80 animate-pulse rounded-lg border border-slate-200 bg-white" />
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${compact ? "lg:grid-cols-2" : "mx-auto w-full max-w-5xl lg:grid-cols-2"}`}>
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">Publications by type</h2>
            <p className="text-sm text-slate-500">Approved records grouped by category.</p>
          </div>
        </div>

        {typeKeys.length > 0 ? (
          <BarChart
            labels={typeKeys.map((key) => publicationTypeMap[key] || key)}
            series={typeKeys.map((key) => data.types[key])}
            height={300}
          />
        ) : (
          <p className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
            No approved publications yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">Publication timeline</h2>
            <p className="text-sm text-slate-500">Approved records by publication year.</p>
          </div>
        </div>

        {yearKeys.length > 0 ? (
          <LineChart
            seriesName="Publications"
            labels={yearKeys}
            series={yearKeys.map((key) => data.years[key])}
            height={300}
          />
        ) : (
          <p className="flex h-64 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
            No yearly data yet.
          </p>
        )}
      </section>
    </div>
  );
}
