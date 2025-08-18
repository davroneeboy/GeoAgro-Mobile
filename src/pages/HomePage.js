import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL1, API_BASE_URL2 } from "../config";
import AuthContext from "../context/AuthContext";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import NotificationsPanel from "../components/NotificationsPanel";
import ContactsPanel from "../components/ContactsPanel";
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

// Названия регионов по ID (для отображения location.region)
const REGION_NAMES = {
  1: "Tashkent",
  2: "Andijan",
  3: "Bukhara",
  4: "Fergana",
  5: "Jizzakh",
  6: "Kashkadarya",
  7: "Navoi",
  8: "Namangan",
  9: "Samarkand",
  10: "Sirdarya",
  11: "Surkhandarya",
  12: "Karakalpakstan",
};

const formatUserLocation = (user) => {
  const loc = user?.location;
  if (!loc) return "No region/district assigned";
  const regionName = REGION_NAMES[loc.region] || (loc.region ? `Region #${loc.region}` : "");
  const districtName = loc.district || "";
  const parts = [regionName, districtName].filter(Boolean);
  return parts.length ? parts.join(", ") : "No region/district assigned";
};

const HomePage = () => {
  const navigate = useNavigate();
  const { authState, logout } = useContext(AuthContext);
  const [controllers, setControllers] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL1}api/users/`, {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
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
        const response = await fetch(`${API_BASE_URL2}api/statistics/`, {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
        const data = await response.json();
        setStatistics(data);
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      }
    };

    if (authState.accessToken) {
      fetchControllers();
      fetchStatistics();
    }
  }, [authState.accessToken]);

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
          "rgba(34, 197, 94, 0.6)",  // green-500 softer
          "rgba(59, 130, 246, 0.6)", // blue-500 softer
          "rgba(234, 179, 8, 0.6)",  // yellow-500 softer
        ],
        borderColor: [
          "rgba(34, 197, 94, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(234, 179, 8, 0.9)",
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
          "rgba(239, 68, 68, 0.5)", // red-500 softer
          "rgba(99, 102, 241, 0.5)", // indigo-500 softer (вместо насыщенного фиолетового)
        ],
        borderColor: [
          "rgba(239, 68, 68, 0.9)",
          "rgba(99, 102, 241, 0.9)",
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
            weight: 'bold',
            color: '#ffffff'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 26, 0.95)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(50, 205, 50, 0.3)',
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
    <div className="min-h-screen bg-gray-900">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              className="h-10 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Agrosanoatni rivojlantirish agentligi
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
                        <button
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Chiqish
            </button>
            <NotificationsPanel />
            <ContactsPanel />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Мобильное меню выпадающее */}
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/statistics/regions"
              className="block w-full bg-green-500 text-white py-2 rounded-lg font-medium text-center hover:bg-green-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              To'liq statistika
            </Link>
            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fermerlar
            </Link>
            {/* Kontaktlar перенесены в компактную панель, ссылка убрана */}
            <Link
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/controllers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Nazoratchilar
            </Link>
          </div>
        )}
      </div>

      {/* Десктопная версия */}
      <div className="hidden lg:flex min-h-screen">
        {/* Левая панель */}
        <div className="w-1/4 p-4 border-r border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex justify-start items-center mb-5">
            <img
              className="h-20 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <p className="text-start font-extrabold text-white max-w-64">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish
              agentligi
            </p>
          </div>

          <div className="space-y-3">
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
              </svg>
              Bog'larga o'tish
            </Link>

            <Link
              to="/statistics/regions"
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium text-center hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              To'liq statistika
            </Link>

            <Link
              to="/farmers"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-3 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Fermerlar
            </Link>
          </div>

          <div className="mt-8">
            <h3 className="text-white font-semibold mb-4">Nazoratchilar</h3>
            <div className="space-y-3">
              {controllers.map((controller) => (
                <Link
                  to="/controllers"
                  key={controller.id}
                  className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <h3 className="text-sm font-medium text-white">
                      {controller.first_name || controller.last_name
                        ? `${controller.first_name} ${controller.last_name}`
                        : controller.username}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {(() => {
                        const iso = (controller.last_login || "").replace(" ", "T");
                        const d = new Date(iso);
                        return isNaN(d) ? "—" : d.toLocaleString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
                      })()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatUserLocation(controller)}
                    </p>
                  </div>
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Центральная панель */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          <div className="p-4 sm:p-6">
            <h1 className="text-white text-3xl font-bold mb-2 flex items-center justify-between">
              <span>Qishloq xo'jaligi statistikasi</span>
              <div className="flex items-center gap-2">
                <ContactsPanel buttonClassName="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors" label="Kontaktlar" />
                <NotificationsPanel />
              </div>
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Tizimga kirgan foydalanuvchi: <span className="text-gray-200 font-semibold">{authState?.username || "Noma'lum foydalanuvchi"}</span>
            </p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <button className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-600 transition-colors">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filtrlarni sozlash
              </button>
              <button className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-600 transition-colors">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Davr tanlash
              </button>
              <button className="bg-gray-700 border border-gray-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-gray-600 transition-colors">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Grafik yaratish
              </button>
            </div>

            {statistics ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">
                      Plantatsiya turlari
                    </h3>
                    <div className="h-72 sm:h-80">
                      <Pie data={plantationTypesData} options={pieChartOptions} />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">
                      Maydonlar
                    </h3>
                    <div className="h-72 sm:h-80">
                      <Pie data={areasData} options={pieChartOptions} />
                    </div>
                  </div>
                </div>
                
                {/* Карточка с фермерами */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 border border-gray-600">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-4 mr-6">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">Fermerlar</h3>
                      <p className="text-4xl font-extrabold text-green-400">
                        {new Intl.NumberFormat('uz-UZ').format(statistics.total_farmers || 0)}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">Umumiy fermerlar soni</p>
                    </div>
                  </div>
                </div>



              </div>
            ) : (
              <div className="text-center text-gray-400 h-96 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
                  Yuklanmoqda...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Правая панель */}
        <div className="w-1/4 p-4 border-l border-gray-700 bg-gray-800 shadow-lg overflow-y-auto">
          <div className="space-y-4">
            {/* Kontaktlar перенесены в компактную панель, ссылка убрана */}
            <button
              onClick={handleLogout}
              className="block w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Chiqish
            </button>
          </div>


          
          <h2 className="mt-6 text-lg font-semibold text-white mb-1">
            Moderatsiya
          </h2>
          <p className="text-xs text-gray-400 mb-4">Kirish: <span className="text-gray-300 font-medium">{authState?.username || "—"}</span></p>
          <div className="space-y-3">
            {Array(3)
              .fill(null)
              .map((_, idx) => (
                <Link
                  to="/moderation"
                  key={idx}
                  className="p-4 border border-gray-600 rounded-lg flex items-center justify-between bg-gray-700 hover:bg-gray-600 transition-colors"
                >
                  <p className="text-sm text-white">
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
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Qishloq xo'jaligi statistikasi
          </h2>
          <p className="text-xs text-gray-400 mb-4 text-center">
            Kirgan foydalanuvchi: <span className="text-gray-300 font-medium">{authState?.username || "—"}</span>
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg flex items-center text-sm hover:bg-gray-600 transition-colors">
              <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filtrlarni sozlash
            </button>
            <button className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg flex items-center text-sm hover:bg-gray-600 transition-colors">
              <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Davr tanlash
            </button>
            <button className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg flex items-center text-sm hover:bg-gray-600 transition-colors">
              <svg className="w-4 h-4 mr-1 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Grafik yaratish
            </button>
          </div>

          {statistics ? (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Plantatsiya turlari
                </h3>
                <div className="h-64">
                  <Pie data={plantationTypesData} options={pieChartOptions} />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Maydonlar
                </h3>
                <div className="h-64">
                  <Pie data={areasData} options={pieChartOptions} />
                </div>
              </div>
              
              {/* Мобильная карточка с фермерами */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-4 border border-gray-500">
                <div className="flex items-center justify-center">
                  <div className="bg-green-500 rounded-full p-3 mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-1">Fermerlar</h3>
                    <p className="text-3xl font-extrabold text-green-400">
                      {new Intl.NumberFormat('uz-UZ').format(statistics.total_farmers || 0)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Umumiy fermerlar soni</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 h-64 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-2"></div>
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
