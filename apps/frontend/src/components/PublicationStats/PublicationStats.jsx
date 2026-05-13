import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../services/api";
import { jwtDecode } from "jwt-decode";
import ReactApexChart from "react-apexcharts";
import BarChart from "./BarChart";
import { publicationTypeMap } from "../../pages/PublicationPage/PublicationsPage";
import LineChart from "./LineChart";

const url = import.meta.env.VITE_API_URL;

export default function PublicationStats() {
  const [data, setData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/login");
          return;
        }

        const decodedToken = jwtDecode(token);
        // if (decodedToken.role !== 'admin') {
        //   navigate('/home-user');
        //   return;
        // }

        const response = await makeAuthenticatedRequest(
          `${url}/api/user/stats`,
          { method: "GET", headers: { Authorization: `Bearer ${token}` } },
          navigate
        );

        if (response.status === 200) {
          console.log("sasts успешно загружены!");
          console.log(response);
          setData(response.data); // Здесь данные из Axios
        } else {
          alert("Не удалось загрузить stats");
        }
      } catch (error) {
        alert("Произошла ошибка при загрузке stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full px-4">
      {/* Publications by Type */}
      <div className="bg-gradient-to-br from-cyan-50 to-white rounded-lg shadow-md p-6 border border-cyan-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Статистика по типам публикаций</h2>
        </div>
        <div className="w-full">
          {data?.types && (
            <BarChart
              labels={Object.keys(data.types).map(k => {
                const label = publicationTypeMap[k];
                return label
                  .replace('Научные труды (Scopus/Web of Science)', 'Scopus/WoS')
                  .replace('Статьи РК и не включенные в Scopus/WoS', 'Статьи РК')
                  .replace('Патенты, авторское свидетельство', 'Патенты')
                  .replace('Материалы конференций', 'Конференции');
              })}
              series={Object.keys(data.types).map(k => data.types[k])}
              height={300}
              width="100%"
            />
          )}
        </div>
      </div>

      {/* Publications by Year */}
      <div className="bg-gradient-to-br from-violet-50 to-white rounded-lg shadow-md p-6 border border-violet-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 rounded-lg">
            <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">Статистика по годам</h2>
        </div>
        <div className="w-full">
          {data?.years && (
            <LineChart
              seriesName="Публикации"
              labels={Object.keys(data.years)}
              series={Object.keys(data.years).map(k => data.years[k])}
              height={300}
              width="100%"
            />
          )}
        </div>
      </div>
    </div>
  );
}
