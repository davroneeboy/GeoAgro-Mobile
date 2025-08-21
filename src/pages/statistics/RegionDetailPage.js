import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Card, Row, Col, Spin, Alert, Statistic, Button, message } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL1, API_BASE_URL2 } from "../../config";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import AuthContext from "../../context/AuthContext";
import { fetchStatisticsData } from "../../utils/apiUtils";
import { exportToExcel } from "../../utils/excelExport";

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
  13: "Xorazm",
};

const RegionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'approved', 'rejected', 'fruits'
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Читаем фильтры из URL параметров
        const searchParams = new URLSearchParams(location.search);
        const estDate = searchParams.get('est_date');
        const plantationType = searchParams.get('plantation_type');
        const regions = searchParams.get('regions');
        const dataType = searchParams.get('data_type');
        
        // Устанавливаем активную вкладку
        if (dataType) {
          setActiveTab(dataType);
        }
        
        let data;
        
        if (!dataType || dataType === 'all') {
          // Для всех плантаций используем обычный API статистики
        let url = `${API_BASE_URL1}api/statistics/regions/${id}/`;
        const queryParams = new URLSearchParams();
        
        if (estDate) {
          queryParams.append("est_date", estDate);
        }
        if (plantationType) {
          queryParams.append("plantation_type", plantationType);
        }
        if (regions) {
          queryParams.append("regions", regions);
        }
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        
          data = await fetchStatisticsData(url, authState.accessToken);
        } else if (dataType === 'approved') {
          // Для подтвержденных используем новый API endpoint
          let approvedUrl = `${API_BASE_URL1}api/statistics/regions/${id}/approved/`;
          const queryParams = new URLSearchParams();
          
          if (estDate) {
            queryParams.append("est_date", estDate);
          }
          if (plantationType) {
            queryParams.append("plantation_type", plantationType);
          }
          
          if (queryParams.toString()) {
            approvedUrl += `?${queryParams.toString()}`;
          }
          
          data = await fetchStatisticsData(approvedUrl, authState.accessToken);
        } else if (dataType === 'rejected') {
          // Для отклоненных используем новый API endpoint
          let rejectedUrl = `${API_BASE_URL1}api/statistics/regions/${id}/rejected/`;
          const queryParams = new URLSearchParams();
          
          if (estDate) {
            queryParams.append("est_date", estDate);
          }
          if (plantationType) {
            queryParams.append("plantation_type", plantationType);
          }
          
          if (queryParams.toString()) {
            rejectedUrl += `?${queryParams.toString()}`;
          }
          
          data = await fetchStatisticsData(rejectedUrl, authState.accessToken);
        } else if (dataType === 'fruits') {
          // Для фруктов используем новый API endpoint
          let fruitsUrl = `${API_BASE_URL1}api/statistics/regions/${id}/fruits/`;
          const queryParams = new URLSearchParams();
          
          if (estDate) {
            queryParams.append("planted_year", estDate);
          }
          
          if (queryParams.toString()) {
            fruitsUrl += `?${queryParams.toString()}`;
          }
          
          data = await fetchStatisticsData(fruitsUrl, authState.accessToken);
        } else {
          // Для модерации используем старый API плантаций
          const plantationsUrl = `${API_BASE_URL2}api/plantations/?is_checked=False`;
          
          const plantationsResponse = await fetch(plantationsUrl, {
            headers: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          });
          
          if (!plantationsResponse.ok) {
            throw new Error(`HTTP error! status: ${plantationsResponse.status}`);
          }
          
          const plantationsData = await plantationsResponse.json();
          const plantations = (plantationsData.results || []).filter(
            plantation => plantation.district?.region === parseInt(id)
          );
          
          // Вычисляем статистику по районам на основе данных плантаций
          const districtStats = {};
          plantations.forEach(plantation => {
            const districtName = plantation.district?.name;
            if (!districtName) return;
            
            if (!districtStats[districtName]) {
              districtStats[districtName] = {
                total_area: 0,
                total_plantations: 0,
                outdated_ga: 0,
                low_fertility: { count: 0, area: 0 },
                high_fertility: { count: 0, area: 0 },
                irrigation: { area: 0, count: 0 },
                investment: { local: 0, foreign: 0, total: 0 },
                subsidy: { subsidy_count: 0, total_subsidy: 0 }
              };
            }
            
            const district = districtStats[districtName];
            district.total_area += plantation.total_area || 0;
            district.total_plantations += 1;
            district.outdated_ga += plantation.outdated_ga || 0;
            
            // Добавляем данные по плодородности
            if (plantation.fertility_score === 'Low') {
              district.low_fertility.count += 1;
              district.low_fertility.area += plantation.total_area || 0;
            } else if (plantation.fertility_score === 'High') {
              district.high_fertility.count += 1;
              district.high_fertility.area += plantation.total_area || 0;
            }
            
            // Добавляем данные по поливу
            district.irrigation.area += plantation.irrigation_area || 0;
            if (plantation.irrigation_area > 0) {
              district.irrigation.count += 1;
            }
            
            // Добавляем инвестиции
            if (plantation.investments) {
              plantation.investments.forEach(inv => {
                if (inv.invest_type === 1) {
                  district.investment.local += inv.investment_amount || 0;
                } else if (inv.invest_type === 2) {
                  district.investment.foreign += inv.investment_amount || 0;
                }
                district.investment.total += inv.investment_amount || 0;
              });
            }
            
            // Добавляем субсидии
            if (plantation.subsidies) {
              plantation.subsidies.forEach(sub => {
                district.subsidy.subsidy_count += 1;
                district.subsidy.total_subsidy += sub.amount || 0;
              });
            }
          });
          
          // Формируем данные в том же формате, что и API статистики
          data = {
            data: districtStats,
            totals: {
              total_area: Object.values(districtStats).reduce((sum, d) => sum + d.total_area, 0),
              total_plantations: Object.values(districtStats).reduce((sum, d) => sum + d.total_plantations, 0),
              total_investment: Object.values(districtStats).reduce((sum, d) => sum + d.investment.total, 0),
              total_subsidy: Object.values(districtStats).reduce((sum, d) => sum + d.subsidy.total_subsidy, 0)
            }
          };
        }
        setStatistics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authState.accessToken, location.search, activeTab]);

  // Функция для экспорта в Excel
  const handleExportToExcel = async () => {
    try {
      setExporting(true);
      
      // Получаем данные для экспорта
      const exportData = tableData;
      const regionName = REGION_NAMES[id] || `Region_${id}`;
      const filename = `${regionName}_${activeTab}_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Экспортируем
      const success = await exportToExcel(exportData, totals, activeTab, regionName, filename);
      
      if (success) {
        message.success('Excel fayl muvaffaqiyatli yuklandi!');
      } else {
        message.error('Excel fayl yuklashda xatolik yuz berdi.');
      }
    } catch (error) {
      console.error('Export error:', error);
      message.error('Excel fayl yuklashda xatolik yuz berdi.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;
  if (!statistics) return <Alert message="Ma'lumot topilmadi" type="info" />;

  // Transform data for table
  const tableData = activeTab === 'fruits' 
    ? (statistics.fruits_by_name || []).map((fruit, index) => ({
        key: fruit.fruit__name || index,
        fruit__name: fruit.fruit__name,
        total_area: fruit.total_area,
        plantation_count: fruit.plantation_count,
        avg_fertility_score: fruit.avg_fertility_score,
        outdated_area: fruit.outdated_area,
        low_fertility_area: fruit.low_fertility_area,
        high_fertility_area: fruit.high_fertility_area,
      }))
    : Object.entries(statistics.data || {}).map(
    ([district, data]) => ({
      key: district,
      district,
      total_area: data.total_area,
      total_plantations: data.total_plantations,
      outdated_ga: data.outdated_ga,
      low_fertility_count: data.low_fertility.count,
      low_fertility_area: data.low_fertility.area,
      high_fertility_count: data.high_fertility.count,
      high_fertility_area: data.high_fertility.area,
      irrigation_area: data.irrigation.area,
      irrigation_count: data.irrigation.count,
      investment_local: data.investment.local,
      investment_foreign: data.investment.foreign,
      investment_total: data.investment.total,
      subsidy_count: data.subsidy.subsidy_count,
      total_subsidy: data.subsidy.total_subsidy,
    })
  );

  // Calculate totals for summary cards
  const totals = activeTab === 'fruits'
    ? {
        total_fruitarea: (statistics.total_stats?.total_fruit_area || 0),
        total_fruits_count: (statistics.total_stats?.total_fruits_count || 0),
        total_plantations: (statistics.total_stats?.total_plantations || 0),
        total_area: (statistics.total_stats?.total_fruit_area || 0),
        total_investment: 0,
        total_subsidy: 0,
      }
    : Object.values(statistics.data || {}).reduce(
    (acc, curr) => ({
      total_area: (acc.total_area || 0) + curr.total_area,
      total_plantations: (acc.total_plantations || 0) + curr.total_plantations,
      outdated_ga: (acc.outdated_ga || 0) + curr.outdated_ga,
      total_investment: (acc.total_investment || 0) + curr.investment.total,
      total_subsidy: (acc.total_subsidy || 0) + curr.subsidy.total_subsidy,
    }),
    {}
  );

  // Add total row
  const totalRow = activeTab === 'fruits' ? {
    key: "total",
    fruit__name: "Jami",
    total_area: totals.total_fruitarea,
    plantation_count: totals.total_plantations,
    avg_fertility_score: 0,
    outdated_area: 0,
    low_fertility_area: 0,
    high_fertility_area: 0,
  } : {
    key: "total",
    district: "Jami",
    total_area: totals.total_area,
    total_plantations: totals.total_plantations,
    outdated_ga: totals.outdated_ga,
    low_fertility_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.low_fertility.count,
      0
    ),
    low_fertility_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.low_fertility.area,
      0
    ),
    high_fertility_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.high_fertility.count,
      0
    ),
    high_fertility_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.high_fertility.area,
      0
    ),
    irrigation_area: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.irrigation.area,
      0
    ),
    irrigation_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.irrigation.count,
      0
    ),
    investment_local: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.investment.local,
      0
    ),
    investment_foreign: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.investment.foreign,
      0
    ),
    investment_total: totals.total_investment,
    subsidy_count: Object.values(statistics.data || {}).reduce(
      (acc, curr) => acc + curr.subsidy.subsidy_count,
      0
    ),
    total_subsidy: totals.total_subsidy,
  };

  // Add total row to tableData
  const dataWithTotal = [...tableData, totalRow];

  const textLight = { color: '#e5e7eb' };

  const columns = activeTab === 'fruits' ? [
    {
      title: <span style={textLight}>Meva nomi</span>,
      dataIndex: "fruit__name",
      key: "fruit__name",
      fixed: "left",
      width: 150,
      render: (text, record) => (
        <span
          style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Maydon (GA)</span>,
      dataIndex: "total_area",
      key: "total_area",
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Plantatsiyalar soni</span>,
      dataIndex: "plantation_count",
      key: "plantation_count",
      render: (value) => <span style={textLight}>{value}</span>,
    },
    {
      title: <span style={textLight}>O'rtacha hosildorlik</span>,
      dataIndex: "avg_fertility_score",
      key: "avg_fertility_score",
      render: (value) => (
        <span style={textLight}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Eskirgan maydon (GA)</span>,
      dataIndex: "outdated_area",
      key: "outdated_area",
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Past hosildorlik (GA)</span>,
      dataIndex: "low_fertility_area",
      key: "low_fertility_area",
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Yuqori hosildorlik (GA)</span>,
      dataIndex: "high_fertility_area",
      key: "high_fertility_area",
      render: (value, record) => (
        <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
          {(value || 0).toFixed(1)}
        </span>
      ),
    },
  ] : [
    {
      title: <span style={textLight}>Tuman</span>,
      dataIndex: "district",
      key: "district",
      fixed: "left",
      width: 150,
      render: (text, record) => (
        <span
          style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}
        >
          {text}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Umumiy maydon</span>,
      children: [
        {
          title: <span style={textLight}>Jami (GA)</span>,
          dataIndex: "total_area",
          key: "total_area",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Plantatsiyalar soni</span>,
          dataIndex: "total_plantations",
          key: "total_plantations",
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Eskirgan (GA)</span>,
          dataIndex: "outdated_ga",
          key: "outdated_ga",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Hosildorlik</span>,
      children: [
        {
          title: <span style={textLight}>Past</span>,
          children: [
            {
              title: <span style={textLight}>Soni</span>,
              dataIndex: "low_fertility_count",
              key: "low_fertility_count",
              render: (value) => <span style={textLight}>{value}</span>,
            },
            {
              title: <span style={textLight}>Maydon</span>,
              dataIndex: "low_fertility_area",
              key: "low_fertility_area",
              render: (value, record) => (
                <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
        {
          title: <span style={textLight}>Yuqori</span>,
          children: [
            {
              title: <span style={textLight}>Soni</span>,
              dataIndex: "high_fertility_count",
              key: "high_fertility_count",
              render: (value) => <span style={textLight}>{value}</span>,
            },
            {
              title: <span style={textLight}>Maydon</span>,
              dataIndex: "high_fertility_area",
              key: "high_fertility_area",
              render: (value, record) => (
                <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
                  {(value || 0).toFixed(1)}
                </span>
              ),
            },
          ],
        },
      ],
    },
    {
      title: <span style={textLight}>Sug'orish</span>,
      children: [
        {
          title: <span style={textLight}>Maydon</span>,
          dataIndex: "irrigation_area",
          key: "irrigation_area",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Soni</span>,
          dataIndex: "irrigation_count",
          key: "irrigation_count",
          render: (value) => <span style={textLight}>{value}</span>,
        },
      ],
    },
    {
      title: <span style={textLight}>Investitsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Mahalliy</span>,
          dataIndex: "investment_local",
          key: "investment_local",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Xorijiy</span>,
          dataIndex: "investment_foreign",
          key: "investment_foreign",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Jami</span>,
          dataIndex: "investment_total",
          key: "investment_total",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Subsidiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Soni</span>,
          dataIndex: "subsidy_count",
          key: "subsidy_count",
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Jami summa</span>,
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
  ];

  return (
    <StatisticsLayout>
      <div className="p-4 sm:p-6" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex items-center mb-4 sm:mb-6">
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              const searchParams = new URLSearchParams(location.search);
              const queryString = searchParams.toString();
              navigate(`/statistics/regions${queryString ? `?${queryString}` : ''}`);
            }}
          >
            Orqaga
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold ml-2 sm:ml-4 text-white">
            {REGION_NAMES[id]} viloyati statistikasi
          </h1>
        </div>

        {/* Вкладки для переключения типов данных */}
        <Card className="mb-4 sm:mb-6" bodyStyle={{ background: '#1f2937', padding: 16 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete('data_type');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}${queryString ? `?${queryString}` : ''}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Barcha planatsiyalar
            </button>
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('data_type', 'approved');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}?${queryString}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Tasdiqlangan
            </button>
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('data_type', 'rejected');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}?${queryString}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Rad etilgan
            </button>
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('data_type', 'fruits');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}?${queryString}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'fruits'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              Fruits
            </button>
          </div>
          
          {/* Кнопка экспорта */}
          <div className="flex justify-end mt-4">
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportToExcel}
              loading={exporting}
              className="bg-green-600 hover:bg-green-700 border-green-600"
              size="large"
            >
              Excel ga eksport qilish
            </Button>
          </div>
        </Card>

        {/* Active Filters Display */}
        {(() => {
          const searchParams = new URLSearchParams(location.search);
          const estDate = searchParams.get('est_date');
          const plantationType = searchParams.get('plantation_type');
          const regions = searchParams.get('regions');
          
          if (activeTab === 'fruits' && estDate) {
            return (
              <div className="mb-4 p-3 bg-orange-900 border border-orange-600 rounded-md">
                <p className="text-orange-200 text-sm font-semibold mb-2">Faol filtrlarni qo'llanilmoqda:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-orange-800 text-orange-200 rounded text-xs">
                    Ekilgan yil: {estDate}
                  </span>
                </div>
              </div>
            );
          }
          
          if (estDate || plantationType || regions) {
            return (
              <div className="mb-4 p-3 bg-blue-900 border border-blue-600 rounded-md">
                <p className="text-blue-200 text-sm font-semibold mb-2">Faol filtrlarni qo'llanilmoqda:</p>
                <div className="flex flex-wrap gap-2">
                  {estDate && (
                    <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs">
                      Yil: {estDate}
                    </span>
                  )}
                  {plantationType && (
                    <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs">
                      Tur: {plantationType}
                    </span>
                  )}
                  {regions && (
                    <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded text-xs">
                      Viloyatlar: {regions}
                    </span>
                  )}
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Summary Cards */}
        <Row gutter={[12, 12]} className="mb-4 sm:mb-6">
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {activeTab === 'approved' ? 'Tasdiqlangan maydon' : 
                   activeTab === 'rejected' ? 'Rad etilgan maydon' :
                   activeTab === 'fruits' ? 'Mevali maydon' :
                   activeTab === 'moderation' ? 'Moderatsiyadagi maydon' : 
                   'Jami maydon'}
                </span>}
                value={activeTab === 'fruits' ? totals.total_fruitarea || totals.total_area : totals.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {activeTab === 'approved' ? 'Tasdiqlangan planatsiyalar' : 
                   activeTab === 'rejected' ? 'Rad etilgan planatsiyalar' :
                   activeTab === 'fruits' ? 'Mevali turlari' :
                   activeTab === 'moderation' ? 'Moderatsiyadagi planatsiyalar' : 
                   'Plantatsiyalar soni'}
                </span>}
                value={activeTab === 'fruits' ? totals.total_fruits_count || totals.total_plantations : totals.total_plantations}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          {activeTab !== 'fruits' && (
            <>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                    title={<span style={{ color: '#9ca3af' }}>
                      {activeTab === 'approved' ? 'Tasdiqlangan investitsiyalar' : 
                       activeTab === 'rejected' ? 'Rad etilgan investitsiyalar' :
                       activeTab === 'moderation' ? 'Moderatsiyadagi investitsiyalar' : 
                       'Jami investitsiyalar'}
                    </span>}
                value={totals.total_investment}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                    title={<span style={{ color: '#9ca3af' }}>
                      {activeTab === 'approved' ? 'Tasdiqlangan subsidiyalar' : 
                       activeTab === 'rejected' ? 'Rad etilgan subsidiyalar' :
                       activeTab === 'moderation' ? 'Moderatsiyadagi subsidiyalar' : 
                       'Jami subsidiyalar'}
                    </span>}
                value={totals.total_subsidy}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
            </>
          )}
        </Row>

        {/* Main Table */}
        <div className="overflow-x-auto">
        <Table
          loading={loading}
          columns={columns}
          dataSource={dataWithTotal}
          scroll={{ x: "max-content" }}
          bordered
            size="small"
          pagination={false}
          className="region-statistics-table"
            style={{ background: '#1f2937', color: '#e5e7eb', minWidth: 600 }}
        />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionDetailPage;
