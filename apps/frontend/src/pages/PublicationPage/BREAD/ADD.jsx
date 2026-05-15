import React, { useEffect, useState } from "react";
import CustomDialog from "../../../components/CustomDialog/CustomDialog";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { makeAuthenticatedRequest } from "../../../services/api";
import { publicationTypeMap } from "../../../constants/publications"; 
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import { crossrefService } from '../../../services/crossrefService';

const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export default function ADD({ updateData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    setValue,
    getValues,
  } = useForm();

  useEffect(() => {
    register("publicationType", { required: "Type is required" });
  }, [register]);

  const selectedPublicationType = watch("publicationType");

  const clear = () => {
    reset();
    setFile(null);
    setErrorMessage(null);
  };
  const onClose = () => {
    setIsOpen(false);
    setCurrentStep(1);
    clear();
  };

  const onSubmit = async (data) => {
    setUploading(true);
    setErrorMessage(null);
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setErrorMessage("Ошибка авторизации. Пожалуйста, войдите снова.");
      setUploading(false);
      navigate("/login"); // Перенаправляем на страницу входа
      return;
    }

    const formData = new FormData();

    data.authors = data.authors
      .split(",")
      .map((author) => author.trim())
      .join(", ");

    if (file) {
      formData.append("file", file);
    }

    Object.keys(data).forEach((key) => {
      if (key === "authors") {
        console.log(data.authors.split(","));
        formData.append(key, data.authors.split(","));
      } else {
        formData.append(key, data[key]);
      }
    });

    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });

    try {
      const response = await makeAuthenticatedRequest(
        `${url}/api/user/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: formData,
        },
        navigate
      );

      if (response.status === 201) {
        if (updateData) {
          updateData();
        }

        onClose();
      } else {
        // console.error('Ошибка при добавлении публикации')
        // const errorData = await response.json();
        // setErrorMessage(`Ошибка: ${errorData.message}`);
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(
        "Произошла ошибка при добавлении публикации. Попробуйте снова."
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

  const [isLoading, setIsLoading] = useState(false);

  // Поиск публикации по DOI
  const handleDOILookup = async () => {
    const doi = getValues("doi");
    if (!doi) return;
    
    setIsLoading(true);
    try {
      const publication = await crossrefService.getWorkByDOI(doi);
      setValue("title", publication.title || "");
      setValue("authors", publication.authors || "");
      setValue("year", publication.year || new Date().getFullYear());
      setValue("output", publication.output || publication.journal || "");
      setValue("journal", publication.journal || "");
      setValue("citations", publication.citations || 0);
      setValue("source", "crossref");
      if (publication.publicationType) {
        setValue("publicationType", publication.publicationType);
      }
    } catch (error) {
      console.error('Error looking up DOI:', error);
      alert('Не удалось найти публикацию по указанному DOI');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        Add publication
      </button>
      <CustomDialog
        isOpen={isOpen}
        title={"Добавить публикацию"}
        onClose={onClose}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col w-full"
        >
          {currentStep === 1 ? (
            <>
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                Выберите тип публикации
              </h2>
              <div className="w-full mb-4">
                <Listbox
                  value={selectedPublicationType}
                  onChange={(value) => setValue("publicationType", value)}
                >
                  <div className="relative">
                    <ListboxButton className="w-full border border-gray-300 bg-white text-left px-4 py-2 cursor-pointer rounded-lg hover:border-gray-400 transition-colors duration-200 text-gray-800">
                      <span className="block overflow-hidden whitespace-nowrap text-ellipsis">
                        {selectedPublicationType
                          ? publicationTypeMap[selectedPublicationType]
                          : "Выберите тип публикации"}
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 6.03 8.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.97 9.28a.75.75 0 011.06 0L10 15.19l2.97-2.91a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </ListboxButton>
                    <ListboxOptions className="absolute z-10 mt-1 w-full rounded-lg shadow-lg overflow-hidden bg-white border border-gray-300">
                      {Object.entries(publicationTypeMap).map(([value, label]) => (
                        <ListboxOption
                          key={value}
                          value={value}
                          className={({ active }) =>
                            `py-2 px-4 cursor-pointer ${active ? 'bg-indigo-500 text-white' : 'text-gray-800'}`
                          }
                        >
                          {label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>
              <span className="text-sm text-red-500">
                {errors.publicationType?.message}
              </span>
              <button
                onClick={() => {
                  const publicationType = getValues("publicationType");
                  if (!publicationType) {
                    setError("publicationType", {
                      message: "Type is required field",
                      type: "required",
                    });
                    return;
                  }
                  setCurrentStep((prev) => prev + 1);
                }}
                type="button"
                className="place-self-end py-2 px-4 text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                Следующий
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 text-gray-800">Новая публикация</h2>
              <input type="hidden" {...register("journal")} />
              <input type="hidden" {...register("citations")} />
              <input type="hidden" {...register("source")} />
              {[
                { title: "authors", label: "Авторы", validate: () => {} },
                { title: "title", label: "Название", validate: () => {} },
                {
                  title: "year",
                  label: "Год",
                  validate: (value) => {
                    // Ensure the input has exactly 4 digits
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
              {selectedPublicationType === "scopus_wos" && (
                <>
                  <label className="block mb-1 font-medium text-gray-700">
                    Ссылки, DOI
                  </label>
                  <input
                    type="text"
                    name="doi"
                    {...register("doi", {
                      required: `DOI is required field`,
                    })}
                    className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  />
                  <span className="text-sm text-red-500">
                    {errors.doi?.message}
                  </span>
                  <button
                    type="button"
                    onClick={handleDOILookup}
                    disabled={isLoading}
                    className="mb-4 py-2 px-4 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Импорт..." : "Заполнить по DOI"}
                  </button>
                  <div className="flex flex-col space-y-3 mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="scopus"
                        {...register("scopus")}
                        className="w-4 h-4 mr-3"
                      />
                      <label className="font-medium text-gray-700">Scopus</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="wos"
                        {...register("wos")}
                        className="w-4 h-4 mr-3"
                      />
                      <label className="font-medium text-gray-700">WoS</label>
                    </div>
                  </div>
                </>
              )}
              {selectedPublicationType === "koknvo" && (
                <>
                  <label className="block mb-1 font-medium text-gray-700">
                    Ссылки, DOI
                  </label>
                  <input
                    type="text"
                    name="doi"
                    {...register("doi", { required: `DOI is required field` })}
                    className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                  />
                  <span className="text-sm text-red-500">
                    {errors.doi?.message}
                  </span>
                  <button
                    type="button"
                    onClick={handleDOILookup}
                    disabled={isLoading}
                    className="mb-4 py-2 px-4 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? "Импорт..." : "Заполнить по DOI"}
                  </button>
                </>
              )}
              {selectedPublicationType === "books" && (
                <>
                  <label className="block mb-1 font-medium text-gray-700">
                    ISBN
                  </label>
                  <input
                    type="text"
                    name="isbn"
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
              {selectedPublicationType === "patents" && (
                <>
                  <label className="block mb-1 font-medium text-gray-700">
                    DOI патента
                  </label>
                  <input
                    type="text"
                    name="patentDoi"
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
                  {...register("visibility")}
                  defaultValue="private"
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
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {errorMessage && (
                  <span className="text-sm text-red-500">
                    {errorMessage}
                  </span>
                )}
                 {errors.file && (
                  <span className="text-sm text-red-500">
                    {errors.file?.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  type="button"
                  className="py-2 px-4 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="py-2 px-4 text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {uploading ? "Загрузка..." : "Отправить"}
                </button>
              </div>
            </>
          )}
        </form>
      </CustomDialog>
    </>
  );
}
