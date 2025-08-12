import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { API_BASE_URL2 } from "../config"; // Убедитесь, что путь к вашему конфигу правильный

const UserInfo = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { authState } = useContext(AuthContext);
  const [hasFetched, setHasFetched] = useState(false); // Флаг для отслеживания запроса

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data for ID:", id); // Лог для отладки
        const response = await axios.get(`${API_BASE_URL2}/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
        console.log("User data fetched successfully:", response.data); // Лог для отладки
        setUserData(response.data);
      } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id && authState.accessToken && !hasFetched) {
      fetchUserData();
      setHasFetched(true); // Устанавливаем флаг после отправки запроса
    }
  }, [id, authState.accessToken, hasFetched]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <p>Маълумотлар юкланмоқда...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 shadow-lg p-4 border-b border-gray-700">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-white text-xl font-bold">Hodim haqida ma'lumot</h1>
          <Link to="/controllers" className="text-sm text-gray-300 hover:text-white">Orqaga</Link>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-800 shadow-lg rounded-lg border border-gray-700 p-6">
          {userData ? (
            <div>
              <p className="font-semibold text-gray-200">
                Ismi sharifi: {userData.first_name} {userData.last_name}
              </p>
              <p className="font-semibold text-gray-200">
                Telefon raqami: {userData.phone_number}
              </p>
              <p className="font-semibold text-gray-200">
                KPI bahosi: {userData.kpi_current.points}
              </p>
              <p className="font-semibold text-gray-200">
                KPI qiymati: {userData.kpi_current.amount}
              </p>
              <p className="font-semibold text-gray-200">
                Ohirgi marta tizimga kirgan vaqti: {userData.last_login}
              </p>
              <p className="font-semibold text-gray-200">
                Viloyat: {userData.region} / Tuman: {userData.district}
              </p>
              <div className="mt-4">
                <a
                  href={`https://t.me/${userData.contact_link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Hodim bilan bog'lanish
                </a>
              </div>
            </div>
          ) : (
            <p className="font-semibold text-gray-300">Hodim haqida malumot topilmadi</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
