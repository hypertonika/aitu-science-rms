import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { makeAuthenticatedRequest } from "../services/api";
import Navbar from "../components/Navbar";

export default function UserProfile() {
  const navigate = useNavigate();
  const { iin } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userData, setUserData] = useState({
    fullName: "",
    profilePhoto: "",
    scopusId: "",
    wosId: "",
    orcid: "",
    birthDate: "",
    phone: "",
    email: "",
    researchArea: "",
    higherSchool: "",
    profileVisibility: "institutional",
    role: "",
  });

  const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      navigate("/login");
      return;
    }

    const decodedToken = jwtDecode(token);
    const isAdmin = decodedToken.role === "admin";
    setIsAdmin(isAdmin);

    const fetchUserData = async () => {
      try {
        const endpoint =
          isAdmin && iin
            ? `${url}/api/admin/user/${iin}`
            : `${url}/api/user/profile`;

        const response = await makeAuthenticatedRequest(
          endpoint,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
          navigate
        );

        if (response.status === 200) {
          setUserData(response.data);
        } else {
          console.warn("Не удалось загрузить профиль пользователя");
          navigate("/login");
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, iin, url]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.error("Файл не выбран");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("profilePhoto", file);

    console.log("Отправляемый файл:", file);
    console.log("Отправляемый FormData:", formData);

    try {
      const response = await fetch(`${url}/api/user/uploadPhoto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        console.log("Файл успешно загружен:", result);
        setUserData((prev) => ({ ...prev, profilePhoto: result.profilePhoto }));
        alert("Фотография успешно обновлена!");
      } else {
        console.error("Ошибка при загрузке файла:", result);
        alert("Ошибка при загрузке фотографии");
      }
    } catch (error) {
      console.error("Ошибка при загрузке фото:", error);
      alert("Произошла ошибка. Попробуйте позже.");
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Ошибка авторизации. Пожалуйста, войдите снова.");
        return;
      }

      // Подготавливаем данные для отправки
      const updateData = {
        fullName: userData.fullName,
        scopusId: userData.scopusId,
        wosId: userData.wosId,
        orcid: userData.orcid,
        birthDate: userData.birthDate,
        phone: userData.phone,
        email: userData.email,
        researchArea: userData.researchArea,
        higherSchool: userData.higherSchool,
        profileVisibility: userData.profileVisibility
      };

      const response = await makeAuthenticatedRequest(
        `${url}/api/user/update`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: updateData
        },
        navigate
      );

      if (response.status === 200) {
        // Обновляем локальное состояние
        setUserData(prevData => ({
          ...prevData,
          ...response.data
        }));
        
        alert("Информация успешно обновлена!");
        setIsEditing(false);
      } else {
        throw new Error(response.data?.message || "Ошибка при обновлении информации");
      }
    } catch (error) {
      console.error("Ошибка при обновлении:", error);
      alert(error.message || "Произошла ошибка. Попробуйте позже.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-lg font-bold">Загрузка...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar role={isAdmin ? "admin" : "user"} />
      <div className="max-w-7xl mx-auto min-h-screen bg-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-48 h-48 mb-4 rounded-full overflow-hidden border-4 border-gray-300">
            <img
              src={
                userData.profilePhoto
                  ? `${url}${userData.profilePhoto}`
                  : "/default-profile.png"
              }
              alt="Profile Photo"
              className="w-full h-full object-cover"
            />
          </div>
          {isEditing && (
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
              Загрузить фото
              <input
                type="file"
                onChange={handleProfilePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            "fullName",
            "scopusId",
            "wosId",
            "orcid",
            "birthDate",
            "phone",
            "email",
            "researchArea"
          ].map((field) => (
            <div key={field}>
              <label className="block mb-1 font-medium text-gray-700">
                {field === "fullName" && "ФИО"}
                {field === "scopusId" && "Scopus Author ID"}
                {field === "wosId" && "Web of Science ResearcherID"}
                {field === "orcid" && "ORCID"}
                {field === "birthDate" && "Дата рождения"}
                {field === "phone" && "Телефон"}
                {field === "email" && "Email"}
                {field === "researchArea" && "Научные интересы"}
              </label>
              {isEditing ? (
                field === "researchArea" ? (
                  <textarea
                    name={field}
                    value={userData[field]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type={field === "birthDate" ? "date" : "text"}
                    name={field}
                    value={userData[field]}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )
              ) : (
                <p className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                  {userData[field] || "Не указано"}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="block mb-1 font-medium text-gray-700">Высшая школа</label>
            {isEditing ? (
              <select
                name="higherSchool"
                value={userData.higherSchool}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите школу</option>
                <option value="Высшая школа информационных технологий и инженерии">Высшая школа информационных технологий и инженерии</option>
                <option value="Высшая школа экономики">Высшая школа экономики</option>
                <option value="Высшая школа права">Высшая школа права</option>
                <option value="Педагогический институт">Педагогический институт</option>
                <option value="Высшая школа искусств и гуманитарных наук">Высшая школа искусств и гуманитарных наук</option>
                <option value="Высшая школа естественных наук">Высшая школа естественных наук</option>
              </select>
            ) : (
              <p className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                {userData.higherSchool || "Не указано"}
              </p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Profile visibility</label>
            {isEditing ? (
              <select
                name="profileVisibility"
                value={userData.profileVisibility || "institutional"}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="private">Private</option>
                <option value="institutional">Institutional</option>
                <option value="public">Public</option>
              </select>
            ) : (
              <p className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100">
                {userData.profileVisibility || "institutional"}
              </p>
            )}
          </div>

        </div>

        

        {!isAdmin && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="py-2 px-4 text-white bg-yellow-600 rounded-lg hover:bg-yellow-700"
            >
              {isEditing ? "Отменить" : "Редактировать"}
            </button>

            {isEditing && (
              <button
                onClick={handleSave}
                className="py-2 px-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Сохранить изменения
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
