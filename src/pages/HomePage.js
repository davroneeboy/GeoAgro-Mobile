import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL1 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const HomePage = () => {
  const navigate = useNavigate();
  const [controllers, setControllers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const handleLogout = () => {
    navigate("/");
  };

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL1}api/users/`);
        const data = await response.json();
        const sortedControllers = data
          .filter((user) => user.last_login)
          .sort(
            (a, b) =>
              new Date(b.last_login).getTime() -
              new Date(a.last_login).getTime()
          )
          .slice(0, 5);
        setControllers(sortedControllers);
      } catch (error) {
        console.error("Ошибка при загрузке контроллеров:", error);
      }
    };

    const fetchStatistics = async () => {
      try {
        const response = await fetch("https://luxa.uz/api/statistics/");
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      }
    };

    fetchControllers();
    fetchStatistics();
  }, []);

  const chartData = {
    labels: [
      "Bog'lar",
      "Uzumzorlar",
      "Issiqxonalar",
      "Umumiy maydon",
      "Meva maydonlari",
      "Fermerlar",
    ],
    datasets: [
      {
        label: "Statistika",
        data: statistics
          ? [
              statistics.total_bogs,
              statistics.total_uzumzors,
              statistics.total_issiqxonas,
              statistics.total_area,
              statistics.total_fruit_areas,
              statistics.total_farmers,
            ]
          : [],
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Qishloq xo'jaligi statistikasi",
      },
    },
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

        <Link
          to="/plantations/uz"
          className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center"
        >
          Bog'larga o'tish
        </Link>

        <Link
          to="/statistics/regions"
          className="block w-full mt-2 bg-green-600 text-white py-2 rounded-lg font-medium text-center"
        >
          To'liq statistika
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
        <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Statistika
          </h2>
          {statistics ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="text-center text-gray-500">Yuklanmoqda...</div>
          )}
        </div>
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
