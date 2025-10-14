import React, { useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL2 } from "../config";
import AuthContext from "../context/AuthContext";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import ContactsPanel from "../components/ContactsPanel";
import { Doughnut } from "react-chartjs-2";
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
        
        // Обрабатываем новую структуру API v2.0
        if (data.summary) {
          setStatistics(data.summary);
        } else {
          setStatistics(data);
        }
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
        label: "Plantatsiya holati",
        data: statistics
          ? [
              statistics.approved_plantations || 0,
              statistics.pending_plantations || 0,
              statistics.rejected_plantations || 0,
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
        data: statistics
          ? [statistics.total_area || 0]
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
        data: statistics
          ? [statistics.total_area || 0] // Используем total_area как пример, так как инвестиции не в summary
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

  // Ирригация (sug'oriladigan) против неирригации
  const irrigationTotal = statistics?.irrigation_stats?.total_irrigation_area || 0;
  const totalAreaAll = statistics?.total_area || 0;
  const nonIrrigation = Math.max(totalAreaAll - irrigationTotal, 0);
  const irrigationPercent = statistics?.irrigation_stats?.percentage_of_total ?? (totalAreaAll ? (irrigationTotal / totalAreaAll) * 100 : 0);
  const irrigationData = {
    labels: ["Sug'oriladigan", "Sug'orilmaydigan"],
    datasets: [
      {
        label: "Sug'orish holati",
        data: [irrigationTotal, nonIrrigation],
        backgroundColor: [
          "rgba(20, 184, 166, 0.6)", // teal-500
          "rgba(75, 85, 99, 0.5)",   // gray-600
        ],
        borderColor: [
          "rgba(20, 184, 166, 0.9)",
          "rgba(75, 85, 99, 0.9)",
        ],
        borderWidth: 2,
      }
    ]
  };

  // Плодородие: низкая vs высокая, центр — средний балл
  const fertilityLow = statistics?.fertility_stats?.low_fertility_area || 0;
  const fertilityHigh = statistics?.fertility_stats?.high_fertility_area || 0;
  const averageFertilityScore = statistics?.fertility_stats?.average_score || 0;
  const fertilityData = {
    labels: ["Past unumdorlik", "Yuqori unumdorlik"],
    datasets: [
      {
        label: "Tuproq unumdorligi",
        data: [fertilityLow, fertilityHigh],
        backgroundColor: [
          "rgba(239, 68, 68, 0.5)", // red-500
          "rgba(34, 197, 94, 0.6)", // green-500
        ],
        borderColor: [
          "rgba(239, 68, 68, 0.9)",
          "rgba(34, 197, 94, 0.9)",
        ],
        borderWidth: 2,
      }
    ]
  };

  const formatNumber = (n) => new Intl.NumberFormat('uz-UZ').format(Math.round(n));
  const plantationTotal = statistics ? (statistics.total_plantations || 0) : 0;
  const areasTotal = statistics ? (statistics.total_area || 0) : 0;
  const investmentsTotal = 0; // Инвестиции не включены в summary API v2.0

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
              <div className="space-y-3">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-base font-semibold text-white mb-2 text-center">
                      Plantatsiya holati
                    </h3>
                    <div className="h-48 md:h-52 lg:h-56">
                      <Doughnut
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
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-base font-semibold text-white mb-2 text-center">
                      Umumiy maydon
                    </h3>
                    <div className="h-48 md:h-52 lg:h-56">
                      <Doughnut
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
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-base font-semibold text-white mb-2 text-center">
                      Jami maydon
                    </h3>
                    <div className="h-48 md:h-52 lg:h-56">
                      <Doughnut
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
                </div>
                
                {/* Дополнительные диаграммы: Ирригация и Уруқдорлик */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-base font-semibold text-white mb-2 text-center">Sug'orish</h3>
                    <div className="h-48 md:h-52 lg:h-56">
                      <Doughnut
                        data={irrigationData}
                        options={{
                          ...pieChartOptions,
                          plugins: {
                            ...pieChartOptions.plugins,
                            centerText: { display: true, text: `${irrigationPercent.toFixed(1)}%`, label: "Sug'oriladigan" }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <h3 className="text-base font-semibold text-white mb-2 text-center">Tuproq unumdorligi</h3>
                    <div className="h-48 md:h-52 lg:h-56">
                      <Doughnut
                        data={fertilityData}
                        options={{
                          ...pieChartOptions,
                          plugins: {
                            ...pieChartOptions.plugins,
                            centerText: { display: true, text: `${averageFertilityScore.toFixed(1)}`, label: "o'rtacha ball" }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Карточка с фермерами */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-3 border border-gray-600">
                  <div className="flex items-center justify-center">
                    <div className="bg-green-500 rounded-full p-3 mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-white mb-1">Plantatsiyalar</h3>
                      <p className="text-3xl font-extrabold text-green-400">
                        {new Intl.NumberFormat('uz-UZ').format(statistics.total_plantations || 0)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Umumiy plantatsiyalar soni</p>
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
              {/* Mobile: Ирригация и Уруқдорлик */}
              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Sug'orish</h3>
                <div className="h-64">
                  <Doughnut
                    data={irrigationData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        centerText: { display: true, text: `${irrigationPercent.toFixed(1)}%`, label: "Sug'oriladigan" }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Tuproq unumdorligi</h3>
                <div className="h-64">
                  <Doughnut
                    data={fertilityData}
                    options={{
                      ...pieChartOptions,
                      plugins: {
                        ...pieChartOptions.plugins,
                        centerText: { display: true, text: `${averageFertilityScore.toFixed(1)}`, label: "o'rtacha ball" }
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

