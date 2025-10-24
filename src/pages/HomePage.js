import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL2 } from "../config";
import AuthContext from "../context/AuthContext";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import ContactsPanel from "../components/ContactsPanel";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Title,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// Плагин для вывода текста по центру пончик-чарта
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    const opts = chart.options?.plugins?.centerText;
    if (!opts || !opts.display || !opts.text) return;
    const { ctx, chartArea } = chart;
    const { left, top, width, height } = chartArea;
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Крупное число
    ctx.fillStyle = '#e5e7eb';
    const mainFontSize = Math.max(Math.min(width, height) / 8, 12);
    ctx.font = `700 ${mainFontSize}px ui-sans-serif, system-ui, -apple-system`;
    ctx.fillText(opts.text, centerX, centerY);
    // Подпись
    if (opts.label) {
      ctx.fillStyle = '#9ca3af';
      const subFontSize = Math.max(Math.min(width, height) / 18, 9);
      ctx.font = `500 ${subFontSize}px ui-sans-serif, system-ui, -apple-system`;
      ctx.fillText(opts.label, centerX, centerY + mainFontSize * 0.75);
    }
    ctx.restore();
  }
};

ChartJS.register(centerTextPlugin);



// формат локации убран — больше не используется на этой странице

// Компактное форматирование больших сумм: ming / mln / mlrd / trln
const formatCompact = (value) => {
  const abs = Math.abs(value || 0);
  const strip = (v) => v.toFixed(1).replace(/\.0$/, '');
  if (abs >= 1e12) return `${strip(value / 1e12)} trln`;
  if (abs >= 1e9) return `${strip(value / 1e9)} mlrd`;
  if (abs >= 1e6) return `${strip(value / 1e6)} mln`;
  if (abs >= 1e3) return `${strip(value / 1e3)} ming`;
  return new Intl.NumberFormat('uz-UZ').format(Math.round(value));
};

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);
  const [statistics, setStatistics] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // удалены состояния контроллеров — панель перенесена в LeftNav
  const isAt = (path) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch(`${API_BASE_URL2}api/statistics/`, {
          headers: {
            Authorization: `Bearer ${authState.accessToken}`,
          },
        });
        const data = await response.json();
        setStatistics(data);
        setIsDataLoaded(true);
      } catch (error) {
        console.error("Ошибка при загрузке статистики:", error);
      }
    };

    if (authState.accessToken) {
      fetchStatistics();
    }
  }, [authState.accessToken]);

  // Отображаемое имя пользователя (ФИО или логин)
  const firstName = authState?.userInfo?.first_name?.trim() || "";
  const lastName = authState?.userInfo?.last_name?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || authState?.userInfo?.username || authState?.username || "—";

  // Первый пай-чарт: Статусы плантаций (согласно новому API v2.0)
  const plantationStatusData = {
    labels: ["Tasdiqlangan", "Kutilmoqda", "Rad etilgan"],
    datasets: [
      {
        label: "Plantatsiya soni",
        data: isDataLoaded && statistics
          ? [
              statistics.plantations?.approved_plantations || 0,
              statistics.plantations?.pending_plantations || 0,
              statistics.plantations?.rejected_plantations || 0,
            ]
          : [],
        backgroundColor: [
          "rgba(34, 197, 94, 0.6)",  // green-500 - approved
          "rgba(245, 158, 11, 0.6)", // yellow-500 - pending
          "rgba(239, 68, 68, 0.6)",  // red-500 - rejected
        ],
        borderColor: [
          "rgba(34, 197, 94, 0.9)",
          "rgba(245, 158, 11, 0.9)",
          "rgba(239, 68, 68, 0.9)",
        ],
        borderWidth: 2,
      },
    ],
  };


  // Второй пай-чарт: Площади (упрощенный для нового API v2.0)
  const areasData = {
    labels: ["Umumiy maydon"],
    datasets: [
      {
        label: "Maydonlar",
        data: isDataLoaded && statistics
          ? [statistics.plantations?.total_area || 0]
          : [],
        backgroundColor: [
          "rgba(59, 130, 246, 0.6)", // blue-500
        ],
        borderColor: [
          "rgba(59, 130, 246, 0.9)",
        ],
        borderWidth: 2,
      },
    ],
  };


  // Третий пай-чарт: Инвестиции (упрощенный для нового API v2.0)
  const investmentsData = {
    labels: ["Jami investitsiyalar"],
    datasets: [
      {
        label: "Investitsiyalar",
        data: isDataLoaded && statistics
          ? [statistics.investment?.total_investment || 0]
          : [],
        backgroundColor: [
          "rgba(16, 185, 129, 0.6)", // emerald-500
        ],
        borderColor: [
          "rgba(16, 185, 129, 0.9)",
        ],
        borderWidth: 2,
      },
    ],
  };






  // Bar chart данные для типов плантаций
  const plantationTypesBarData = {
    labels: ["Bog'lar", "Uzumzorlar", "Issiqxonalar"],
    datasets: [
      {
        label: "Maydon (ga)",
        data: isDataLoaded && statistics
          ? [
              statistics.plantation_types?.bogs_area || 0,
              statistics.plantation_types?.uzumzors_area || 0,
              statistics.plantation_types?.issiqxonas_area || 0,
            ]
          : [],
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",   // green-500 - bogs
          "rgba(168, 85, 247, 0.8)",  // purple-500 - uzumzors
          "rgba(245, 158, 11, 0.8)",   // yellow-500 - issiqxonas
        ],
        borderColor: [
          "rgba(34, 197, 94, 1)",
          "rgba(168, 85, 247, 1)",
          "rgba(245, 158, 11, 1)",
        ],
        borderWidth: 2,
      }
    ]
  };










  // Doughnut Chart данные для плодородия (заменяем Radar на Doughnut)
  const fertilityDoughnutData = {
    labels: ["Past unumdorlik", "Yuqori unumdorlik"],
    datasets: [
      {
        label: "Unumdorlik maydoni (ga)",
        data: isDataLoaded && statistics ? [
          statistics?.fertility?.low_fertility_area || 0,
          statistics?.fertility?.high_fertility_area || 0,
        ] : [],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",
          "rgba(34, 197, 94, 0.8)",
        ],
        borderColor: [
          "rgba(239, 68, 68, 1)",
          "rgba(34, 197, 94, 1)",
        ],
        borderWidth: 2,
      }
    ]
  };


  const formatNumber = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));
  const plantationTotal = statistics?.plantations?.total_plantations || 0;
  const areasTotal = statistics?.plantations?.total_area || 0;
  const investmentsTotal = statistics?.investment?.total_investment || 0;

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 8,
          font: {
            size: window.innerWidth < 768 ? 9 : 11,
            weight: 'bold',
            color: '#ffffff'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8
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

  // Настройки для чартов с количеством (не гектары)
  const barChartOptionsCount = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 8,
          font: {
            size: window.innerWidth < 768 ? 9 : 11,
            weight: 'bold',
            color: '#ffffff'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8
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
            return `${context.label}: ${new Intl.NumberFormat('uz-UZ').format(context.parsed.y)} ta`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      },
      y: {
        ticks: {
          color: '#ffffff',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            weight: 'bold'
          },
          callback: function(value) {
            return new Intl.NumberFormat('uz-UZ').format(value);
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };

  // Настройки для чартов с площадями (гектары)
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 8,
          font: {
            size: window.innerWidth < 768 ? 9 : 11,
            weight: 'bold',
            color: '#ffffff'
          },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8
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
            return `${context.label}: ${new Intl.NumberFormat('uz-UZ').format(context.parsed.y)} ga`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      },
      y: {
        ticks: {
          color: '#ffffff',
          font: {
            size: window.innerWidth < 768 ? 10 : 12,
            weight: 'bold'
          },
          callback: function(value) {
            return new Intl.NumberFormat('uz-UZ').format(value);
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };


  return (
    <div className="h-screen bg-gray-900 overflow-hidden">
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
              className={`block w-full ${isAt('/plantations/uz') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to={authState.userRole === "headof_region" ? "/statistics/controllers" : "/statistics/regions"}
              className={`block w-full ${isAt('/statistics') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              To'liq statistika
            </Link>
            <Link
              to="/farmers"
              className={`block w-full ${isAt('/farmers') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fermerlar
            </Link>
            {/* Kontaktlar перенесены в компактную панель, ссылка убрана */}
            <Link
              to="/moderation"
              className={`block w-full ${isAt('/moderation') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/approved-plantations"
              className={`block w-full ${isAt('/approved-plantations') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tasdiqlangan bog'lar
            </Link>
            <Link
              to="/rejected-plantations"
              className={`block w-full ${isAt('/rejected-plantations') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 border border-gray-600 hover:bg-gray-600'} text-white py-2 rounded-lg font-medium text-center transition-colors`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Rad etilgan bog'lar
            </Link>
          </div>
        )}
      </div>

      {/* Основная область (без левой панели — теперь она общая) */}
      <div className="hidden lg:flex lg:flex-col lg:h-full lg:overflow-hidden">
          <div className="p-3 sm:p-4 flex-1 overflow-y-auto no-scrollbar">
            <h1 className="text-white text-2xl font-bold mb-2 flex items-center justify-between">
              <span>Qishloq xo'jaligi statistikasi</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-800 border border-gray-700 rounded-full px-3 py-1">
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-200 font-medium">{displayName}</span>
                </div>
              </div>
            </h1>
            
            {/* removed quick action buttons */}

            {statistics ? (
              <div className="space-y-6">
                {/* Основные KPI карточки */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 border border-green-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">Jami plantatsiyalar</p>
                        <p className="text-white text-2xl font-bold">{statistics?.plantations?.total_plantations ? statistics.plantations.total_plantations.toLocaleString() : '—'}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 border border-blue-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Umumiy maydon</p>
                        <p className="text-white text-2xl font-bold">{statistics?.plantations?.total_area ? `${formatCompact(statistics.plantations.total_area)} GA` : '—'}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 border border-purple-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Jami investitsiyalar</p>
                        <p className="text-white text-2xl font-bold">{statistics?.investment?.total_investment ? `${formatCompact(statistics.investment.total_investment)} so'm` : '—'}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 border border-orange-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-medium">Fermerlar soni</p>
                        <p className="text-white text-2xl font-bold">{statistics?.farmers?.total_farmers ? statistics.farmers.total_farmers.toLocaleString() : '—'}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Основные чарты */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Статус плантаций */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Plantatsiya holati</h3>
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-64">
                       <Bar
                         key={`plantation-status-${statistics?.plantations?.total_plantations || 0}`}
                         data={plantationStatusData}
                         options={barChartOptionsCount}
                       />
                    </div>
                  </div>

                  {/* Типы плантаций */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Plantatsiya turlari</h3>
                      <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-64">
                      <Bar
                        key={`plantation-types-${statistics?.plantation_types?.bogs_area || 0}`}
                        data={plantationTypesBarData}
                        options={barChartOptions}
                      />
                    </div>
                  </div>

                  {/* Плодородие почвы */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Tuproq unumdorligi</h3>
                      <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="h-64">
                      <Bar
                        key={`fertility-${statistics?.fertility?.avg_fertility_score || 0}`}
                        data={fertilityDoughnutData}
                        options={barChartOptions}
                      />
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

      {/* Мобильная версия контента */}
      <div className="lg:hidden p-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-2 text-center">
            Qishloq xo'jaligi statistikasi
          </h2>
          
          {/* removed quick action buttons (mobile) */}

          {statistics ? (
            <div className="space-y-6">
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Plantatsiya turlari
                </h3>
                <div className="h-64">
                  <Doughnut
                    key={`plantation-status-${statistics?.plantations?.total_plantations || 0}`}
                    data={plantationStatusData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        centerText: { display: true, text: formatNumber(plantationTotal), label: 'Jami' }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Maydonlar
                </h3>
                <div className="h-64">
                  <Doughnut
                    key={`areas-${statistics?.plantations?.total_area || 0}`}
                    data={areasData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        centerText: { display: true, text: formatNumber(areasTotal), label: 'Jami' }
                      }
                    }}
                  />
                </div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">
                  Investitsiyalar
                </h3>
                <div className="h-64">
                  <Doughnut
                    key={`investments-${statistics?.investment?.total_investment || 0}`}
                    data={investmentsData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        tooltip: {
                          ...pieChartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context) {
                              const formatter = new Intl.NumberFormat('uz-UZ');
                              const value = context.parsed;
                              return `${context.label}: ${formatter.format(value)} so'm`;
                            }
                          }
                        },
                        centerText: { display: true, text: `${formatCompact(investmentsTotal)}`, label: "so'm" }
                      }
                    }}
                  />
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
                        {new Intl.NumberFormat('uz-UZ').format(statistics.farmers?.total_farmers || 0)}
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

