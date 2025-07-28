import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL1, API_BASE_URL2 } from "../config";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const HomePage = () => {
  const navigate = useNavigate();
  const [controllers, setControllers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        const response = await fetch(`${API_BASE_URL2}api/statistics/`);
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      }
    };



    fetchControllers();
    fetchStatistics();
  }, []);

  // Первый пай-чарт: Типы плантаций
  const plantationTypesData = {
    labels: ["Bog'lar", "Uzumzorlar", "Issiqxonalar"],
    datasets: [
      {
        label: "Plantatsiya turlari",
        data: statistics
          ? [
              statistics.total_bogs,
              statistics.total_uzumzors,
              statistics.total_issiqxonas,
            ]
          : [],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(245, 158, 11, 0.8)",
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(245, 158, 11, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Второй пай-чарт: Площади
  const areasData = {
    labels: ["Umumiy maydon", "Meva maydonlari"],
    datasets: [
      {
        label: "Maydonlar",
        data: statistics
          ? [statistics.total_area, statistics.total_fruit_areas]
          : [],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(168, 85, 247, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          font: {
            size: window.innerWidth < 768 ? 11 : 13,
            weight: 'bold'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${new Intl.NumberFormat('uz-UZ').format(context.parsed)} (${percentage}%)`;
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-white shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              className="h-12 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <p className="text-sm font-bold text-gray-900">
              Agrosanoatni rivojlantirish agentligi
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Мобильное меню выпадающее */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/plantations/uz"
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/statistics/regions"
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              To'liq statistika
            </Link>
            <Link
              to="/farmers"
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fermerlar
            </Link>
            <Link
              to="/contacts"
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Kontaktlar
            </Link>
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Chiqish
            </button>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex h-screen">
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r bg-white shadow-md overflow-y-auto">
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
            className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
          >
            Bog'larga o'tish
          </Link>

          <Link
            to="/statistics/regions"
            className="block w-full mt-2 bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
          >
            To'liq statistika
          </Link>

          <Link
            to="/farmers"
            className="block w-full mt-2 bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
          >
            Fermerlar
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
        <div className="flex-1 p-6 bg-gray-50 flex flex-col">
          <div className="w-full max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Qishloq xo'jaligi statistikasi
            </h2>
            {statistics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      Plantatsiya turlari
                    </h3>
                    <div className="h-80">
                      <Pie data={plantationTypesData} options={pieChartOptions} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      Maydonlar
                    </h3>
                    <div className="h-80">
                      <Pie data={areasData} options={pieChartOptions} />
                    </div>
                  </div>
                </div>
                
                {/* Карточка с фермерами */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-100 rounded-full p-4 mr-6">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Fermerlar</h3>
                      <p className="text-4xl font-extrabold text-blue-600">
                        {new Intl.NumberFormat('uz-UZ').format(statistics.total_farmers)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">Umumiy fermerlar soni</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 h-96 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                  Yuklanmoqda...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l bg-white shadow-md overflow-y-auto">
          <div className="space-y-4">
            <Link
              to="/contacts"
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium text-center hover:bg-green-700 transition-colors"
            >
              Kontaktlar
            </Link>
            <button
              onClick={handleLogout}
              className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
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
                  <button className="py-1 px-3 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors">
                    Ko'proq
                  </button>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
            Qishloq xo'jaligi statistikasi
          </h2>
          {statistics ? (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  Plantatsiya turlari
                </h3>
                <div className="h-64">
                  <Pie data={plantationTypesData} options={pieChartOptions} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                  Maydonlar
                </h3>
                <div className="h-64">
                  <Pie data={areasData} options={pieChartOptions} />
                </div>
              </div>
              
              {/* Мобильная карточка с фермерами */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-center">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Fermerlar</h3>
                    <p className="text-3xl font-extrabold text-blue-600">
                      {new Intl.NumberFormat('uz-UZ').format(statistics.total_farmers)}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Umumiy fermerlar soni</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 h-64 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                Yuklanmoqda...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
