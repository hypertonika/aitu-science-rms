import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../services/api";
import { generateReport, generateUserReport } from "../services/reportUtils";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { publicationTypeMap, statusMap, visibilityMap } from "./PublicationPage/PublicationsPage";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import PublicationComponents from "../components/FilterComponents/PublicationComponents";
import Pagination from '../components/Pagination/Pagination';

export const allHigherSchools = [
  "Высшая школа информационных технологий и инженерии",
  "Высшая школа экономики",
  "Высшая школа права",
  "Педагогический институт",
  "Высшая школа искусств и гуманитарных наук",
  "Высшая школа естественных наук",
];

export default function AdminPublications() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [type, setType] = useState(null);
  const [year, setYear] = useState(null);
  const [school, setSchool] = useState(null);
  const [name, setName] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [publications, setPublications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const [selectedSchool, setSelectedSchool] = useState('all');
  
  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const decodedToken = jwtDecode(token);
      if (decodedToken.role !== "admin") {
        navigate("/home-user");
        return;
      }

      const response = await makeAuthenticatedRequest(
        `${url}/api/admin/publications`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          params: { publicationType: type, school, year, name, status: status || undefined, query: search || undefined },
        },
        navigate
      );

      if (response.status === 200) {
        console.log("Публикации успешно загружены!");
        console.log(response);
        setPublications(response.data);
      } else {
        alert("Не удалось загрузить публикации");
      }
    } catch (error) {
      alert("Произошла ошибка при загрузке публикаций");
    } finally {
      setIsLoading(false);
    }
  }, [navigate, type, url, school, year, name, status, search]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData, navigate]);

  const paginatedPublications = publications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(publications.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleReview = async (id, action) => {
    try {
      const token = localStorage.getItem("accessToken");
      await makeAuthenticatedRequest(`${url}/api/admin/publications/${id}/${action}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: { comment: action === "approve" ? "Approved" : "Needs revision" },
      }, navigate);
      fetchData();
    } catch (error) {
      alert("Не удалось обновить статус публикации");
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await makeAuthenticatedRequest(`${url}/api/admin/publications/export`, {
        method: "GET",
        responseType: "blob",
        params: { format, school: selectedSchool === "all" ? undefined : selectedSchool },
      }, navigate);
      const blob = new Blob([response.data], { type: format === "pdf" ? "application/pdf" : "text/csv" });
      const reportUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = reportUrl;
      a.download = `approved_publications.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(reportUrl);
      a.remove();
    } catch (error) {
      alert("Не удалось экспортировать публикации");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg font-bold text-gray-700">Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar role="admin" />
      <div className="min-h-screen bg-gray-100 p-8 mt-0">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 w-full">
          <h1 className="text-2xl font-bold text-gray-800">Публикации всех сотрудников</h1>
          <div className="flex flex-1 gap-2 items-center justify-end">
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className="h-11 px-4 rounded-lg border border-gray-300 bg-white text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full sm:w-auto min-w-[180px]"
            >
              <option value="all">Все школы</option>
              {allHigherSchools.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
            <button
              onClick={() => generateReport(url, navigate, selectedSchool)}
              className="h-11 px-4 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition w-full sm:w-auto text-sm"
            >
              Генерировать отчёт
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="h-11 px-4 rounded-lg bg-slate-600 text-white font-semibold shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition w-full sm:w-auto text-sm"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="h-11 px-4 rounded-lg bg-slate-600 text-white font-semibold shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition w-full sm:w-auto text-sm"
            >
              PDF
            </button>
          </div>
        </div>

        <PublicationComponents setYear={setYear} setName={setName} setSchool={setSchool} setType={setType} school={school} type={type}/>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
            placeholder="Search title, author, DOI"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All statuses</option>
            {Object.entries(statusMap).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="mt-6">
          {paginatedPublications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedPublications.map((publication) => (
                <div key={publication._id} className="flex flex-col justify-between border border-gray-300 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden min-h-[300px]">
                  <div className="p-4">
                    <div className="mb-3 pb-2 border-b border-gray-300">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-white bg-indigo-500 rounded-full mb-1">
                        {publicationTypeMap[publication.publicationType]}
                      </span>
                      <span className="inline-block ml-2 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full mb-1">
                        {statusMap[publication.status] || publication.status || 'Draft'}
                      </span>
                      <h3 className="text-base font-semibold line-clamp-2 mb-1 text-gray-800 text-left" title={publication.title}>
                        {publication.title}
                      </h3>
                      <p className="text-xs text-gray-600 text-left">
                        Год: {publication.year}
                      </p>
                    </div>
                    
                    <div className="text-xs text-gray-700 text-left">
                      <p className="mb-2 line-clamp-2 flex" title={`Авторы: ${publication.authors}`}>
                        <span className="font-medium text-gray-800 min-w-[80px]">Авторы:</span> 
                        <span>{publication.authors}</span>
                      </p>
                      <p className="mb-2 line-clamp-2 flex" title={`Выходные данные: ${publication.output}`}>
                        <span className="font-medium text-gray-800 min-w-[80px]">Данные:</span> 
                        <span>{publication.output}</span>
                      </p>
                      {publication.doi && (
                        <p className="mb-2 line-clamp-1 flex" title={`DOI: ${publication.doi}`}>
                          <span className="font-medium text-gray-800 min-w-[80px]">DOI:</span> 
                          <span>{publication.doi}</span>
                        </p>
                      )}
                      {publication.isbn && (
                        <p className="mb-2 line-clamp-1 flex" title={`ISBN: ${publication.isbn}`}>
                          <span className="font-medium text-gray-800 min-w-[80px]">ISBN:</span> 
                          <span>{publication.isbn}</span>
                        </p>
                      )}
                      {publication.file && (
                        <p className="mb-2 flex">
                          <span className="font-medium text-gray-800 min-w-[80px]">Файл:</span>
                          <a href={`${url}/${publication.file}`} download className="text-blue-500 hover:text-blue-600 hover:underline flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Скачать файл
                          </a>
                        </p>
                      )}
                      <p className="mb-2 line-clamp-1 flex">
                        <span className="font-medium text-gray-800 min-w-[80px]">Visibility:</span>
                        <span>{visibilityMap[publication.visibility] || publication.visibility || 'Private'}</span>
                      </p>
                      {publication.reviewComment && (
                        <p className="mb-2 line-clamp-2 flex" title={publication.reviewComment}>
                          <span className="font-medium text-gray-800 min-w-[80px]">Review:</span>
                          <span>{publication.reviewComment}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {publication.status === 'submitted' && (
                    <div className="flex items-center justify-end gap-2 bg-gray-50 p-2 mt-auto border-t border-gray-300">
                      <button
                        onClick={() => handleReview(publication._id, 'approve')}
                        className="py-1 px-2 text-xs text-white bg-emerald-500 rounded-lg hover:bg-emerald-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(publication._id, 'reject')}
                        className="py-1 px-2 text-xs text-white bg-rose-500 rounded-lg hover:bg-rose-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center min-h-[50vh] w-full">
              <p className="text-gray-600 text-lg">Публикации не найдены.</p>
            </div>
          )}
        </div>

        {publications.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </>
  );
}
