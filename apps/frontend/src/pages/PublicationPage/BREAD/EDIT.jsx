import React, { useState } from "react";
import CustomDialog from "../../../components/CustomDialog/CustomDialog";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../../services/api";
const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function EDIT({ pub, updateData, resetPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const clear = () => {
    reset();
    setFile(null);
    setErrorMessage(null);
  };
  const onClose = () => {
    setIsOpen(false);
    clear();
  };

  const onSubmit = async (data) => {
    setUploading(true);
    setErrorMessage(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setErrorMessage("Ошибка авторизации. Пожалуйста, войдите снова.");
      setUploading(false);
      navigate("/login");
      return;
    }

    try {
      // Создаем объект данных
      const formData = new FormData();

      // Правильно обрабатываем авторов
      const authors = data.authors
        .split(",")
        .map((author) => author.trim())
        .filter(Boolean)
        .join(", ");

      // Добавляем основные поля
      formData.append("authors", String(authors));
      formData.append("title", String(data.title));
      formData.append("year", String(data.year));
      formData.append("output", String(data.output));
      formData.append("iin", String(pub.iin));
      
      // Добавляем тип публикации и статус
      formData.append("publicationType", pub.publicationType || "articles");
      formData.append("visibility", data.visibility || pub.visibility || "private");

      // Добавляем DOI если это Scopus/WoS публикация
      if (pub?.publicationType === "scopus_wos") {
        formData.append("doi", data.doi || "");
        formData.append("scopus", data.scopus ? "true" : "false");
        formData.append("wos", data.wos ? "true" : "false");
      }

      // Добавляем DOI для KOKNVO
      if (pub?.publicationType === "koknvo" && data.doi) {
        formData.append("doi", data.doi);
      }

      // Добавляем ISBN для книг
      if (pub?.publicationType === "books" && data.isbn) {
        formData.append("isbn", data.isbn);
      }

      // Добавляем DOI патента
      if (pub?.publicationType === "patents" && data.patentDoi) {
        formData.append("patentDoi", data.patentDoi);
      }

      // Добавляем файл если он был выбран
      if (file) {
        formData.append("file", file);
      }

      // Логируем данные для отладки
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await makeAuthenticatedRequest(
        `${url}/api/user/upload/${pub._id}`,
        {
          method: "PATCH",
          data: formData,
          headers: {
            Authorization: `Bearer ${token}`
          },
        },
        navigate
      );

      console.log('Ответ сервера:', response);

      if (response.status === 200) {
        // Закрываем диалог
        onClose();
        
        // Принудительно обновляем список публикаций
        if (typeof updateData === 'function') {
          try {
            await updateData();
            if (typeof resetPage === 'function') {
              resetPage();
            }
            console.log('Список публикаций обновлен');
          } catch (updateError) {
            console.error('Ошибка при обновлении списка:', updateError);
          }
        }
      } else {
        throw new Error('Не удалось обновить публикацию');
      }
    } catch (error) {
      console.error('Error updating publication:', error);
      console.error('Error response:', error.response?.data);
      setErrorMessage(
        error.response?.data?.message || 
        "Произошла ошибка при обновлении публикации. Попробуйте снова."
      );
    }
    setUploading(false);
  };

  const handleFileChange = (e) => {
    setErrorMessage(null);
    const file = e.target.files[0];

    if (file && file.size > 10 * 1024 * 1024) {
      setErrorMessage("Файл не должен превышать 5MB.");
      e.target.value = "";
      return;
    }

    if (file && !/\.(pdf|doc|docx)$/i.test(file.name)) {
      setErrorMessage("Допустим только формат PDF.");
      e.target.value = "";
      return;
    }

    setFile(file);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800"
      >
        Edit
      </button>
      <CustomDialog isOpen={isOpen} title="Edit publication" onClose={onClose}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col w-full"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800">Текущая публикация</h2>
          {[
            { title: "authors", label: "Авторы", validate: () => {} },
            { title: "title", label: "Название", validate: () => {} },
            {
              title: "year",
              label: "Год",
              validate: (value) => {
                const regex = /^\d{4}$/;
                if (!regex.test(value)) {
                  return "Year must be exactly 4 digits";
                }
                return true;
              },
            },
          ].map((field) => (
            <div key={field.title} className="mb-4">
              <label className="block mb-1 font-medium text-gray-700">
                {field.label}
              </label>
              <input
                type="text"
                name={field.title}
                defaultValue={pub?.[field.title]}
                {...register(field.title, {
                  validate: field.validate,
                  required: `${field.title} is required field`,
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <span className="text-sm text-red-500">
                {errors[field.title]?.message}
              </span>
            </div>
          ))}

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Выходные данные
            </label>
            <textarea
              name="output"
              defaultValue={pub?.output}
              {...register("output", {
                required: `Output is required field`,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              rows={3}
            />
            <span className="text-sm text-red-500">
              {errors.output?.message}
            </span>
          </div>

          {pub?.publicationType === "scopus_wos" && (
            <>
              <label className="block mb-1 font-medium text-gray-700">
                Ссылки, DOI
              </label>
              <input
                type="text"
                defaultValue={pub?.doi}
                name="doi"
                {...register("doi", { required: `DOI is required field` })}
                className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <span className="text-sm text-red-500">
                {errors.doi?.message}
              </span>
              <div className="flex flex-col space-y-3 mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="scopus"
                    defaultChecked={pub?.scopus}
                    {...register("scopus")}
                    className="w-4 h-4 mr-3"
                  />
                  <label className="font-medium text-gray-700">Scopus</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="wos"
                    defaultChecked={pub?.wos}
                    {...register("wos")}
                    className="w-4 h-4 mr-3"
                  />
                  <label className="font-medium text-gray-700">WoS</label>
                </div>
              </div>
            </>
          )}
          {pub?.publicationType === "koknvo" && (
            <>
              <label className="block mb-1 font-medium text-gray-700">
                Ссылки, DOI
              </label>
              <input
                type="text"
                name="doi"
                defaultValue={pub?.doi}
                {...register("doi", { required: `DOI is required field` })}
                className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <span className="text-sm text-red-500">
                {errors.doi?.message}
              </span>
            </>
          )}
          {pub?.publicationType === "books" && (
            <>
              <label className="block mb-1 font-medium text-gray-700">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                defaultValue={pub?.isbn}
                {...register("isbn", {
                  required: `ISBN is required field`,
                })}
                className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <span className="text-sm text-red-500">
                {errors.isbn?.message}
              </span>
            </>
          )}
          {pub?.publicationType === "patents" && (
            <>
              <label className="block mb-1 font-medium text-gray-700">
                DOI патента
              </label>
              <input
                type="text"
                name="patentDoi"
                defaultValue={pub?.patentDoi}
                {...register("patentDoi", {
                  required: `Patent DOI is required field`,
                })}
                className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
              <span className="text-sm text-red-500">
                {errors.patentDoi?.message}
              </span>
            </>
          )}

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Видимость
            </label>
            <select
              defaultValue={pub?.visibility || "private"}
              {...register("visibility")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            >
              <option value="private">Приватно</option>
              <option value="institutional">Внутри университета</option>
              <option value="public">Публично</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-medium text-gray-700">
              Загрузить файл (PDF, макс. 5MB)
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errorMessage && (
              <span className="text-sm text-red-500">{errorMessage}</span>
            )}
            {errors.file && (
              <span className="text-sm text-red-500">
                {errors.file?.message}
              </span>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="py-2 px-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {uploading ? "Загрузка..." : "Сохранить"}
            </button>
          </div>
        </form>
      </CustomDialog>
    </>
  );
}
