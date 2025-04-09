import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL1 } from "../config";
import { API_BASE_URL2 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";

const HomePage = () => {
  const navigate = useNavigate();
  const [controllers, setControllers] = useState([]);
  const [statistics, setStatistics] = useState(null); // Добавлено состояние для статистики

  const handleLogout = () => {
    // Очистка сессии или токена (если необходимо)
    navigate("/");
  };

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL1}api/users/`);
        const data = await response.json();
        // Фильтруем только тех, у кого есть last_login, и сортируем по времени
        const sortedControllers = data
          .filter((user) => user.last_login) // Только те, кто заходил
          .sort(
            (a, b) =>
              new Date(b.last_login).getTime() -
              new Date(a.last_login).getTime()
          )
          .slice(0, 5); // Берем только 5 самых активных
        setControllers(sortedControllers);
      } catch (error) {
        console.error("Ошибка при загрузке контроллеров:", error);
      }
    };

    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL1}api/statistics/`);
        const data = await response.json();
        setStatistics(data); // Устанавливаем полученные данные
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      }
    };

    fetchControllers();
    fetchStatistics();
  }, []);

  const calculatePercentage = (value) => {
    if (!statistics) return 0;
    const total = statistics.total_issiqxonas + statistics.total_uzumzors + statistics.total_bogs;
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Левая панель */}
      <div className="w-1/4 p-4 border-r bg-white shadow-md">
        <div className="flex justify-start items-center mb-5">
          <img
            className="h-20 w-auto mr-3"
            src={uzbekistanEmblem}
            alt="O'zbekiston gerbi"
          />
          <p className="text-start font-extrabold text-gray-900 max-w-64">
            Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
            agentligi
          </p>
        </div>
        
        {/* Добавляем ссылку на статистику */}
        <Link
          to="/statistics/regions"
          className="block w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium text-center mb-4 hover:bg-green-700"
        >
          Statistika
        </Link>

        <Link
          to="/plantations/uz"
          className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center"
        >
          Bog'larga o'tish
        </Link>
        <h2 className="mt-6 text-lg font-semibold text-gray-800">
          <Link to="/controllers">Nazoratchilar</Link>
        </h2>
        <div className="mt-4 space-y-4 text-left">
          {controllers.map((controller) => (
            <Link
              to="/controllers"
              key={controller.id}
              className="p-4 border rounded-lg flex items-center justify-between bg-gray-100 hover:shadow-lg transition"
            >
              <div>
                <h3 className="text-sm font-medium text-gray-800">
                  {controller.first_name || controller.last_name
                    ? `${controller.first_name} ${controller.last_name}`
                    : controller.username}
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(controller.last_login).toLocaleTimeString()}
                </p>
                <p className="text-xs text-gray-500">
                  {controller?.region && controller?.districts?.length > 0
                    ? `${controller.region}, ${controller.districts.join(", ")}`
                    : "No region/district assigned"}
                </p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
            </Link>
          ))}
        </div>
      </div>

      {/* Центральная панель */}
      <div className="flex-1 p-6 bg-gray-50 flex flex-col items-center justify-center">
        <a
          href="/statistics/regions"
          className="text-3xl font-semibold text-gray-800 mb-6 text-center"
        >
          Statistika
        </a>
      </div>

      {/* Правая панель */}
      <div className="w-1/4 p-4 border-l bg-white shadow-md">
        <div className="space-y-4">
          <Link
            to="/contacts"
            className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center"
          >
            Kontaktlar
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium"
          >
            Chiqish
          </button>
        </div>
        <h2 className="mt-6 text-lg font-semibold text-gray-800">
          <Link to="/moderation">Moderatsiya</Link>
        </h2>
        <div className="mt-4 space-y-4">
          {Array(3)
            .fill(null)
            .map((_, idx) => (
              <Link
                to="/moderation"
                key={idx}
                className="p-4 border rounded-lg flex items-center justify-between bg-gray-100 hover:shadow-lg transition"
              >
                <p className="text-sm text-gray-800">
                  Toshkent viloyati, Tashkent
                </p>
                <button className="py-1 px-3 bg-blue-500 text-white rounded-md text-sm">
                  Ko'proq
                </button>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
