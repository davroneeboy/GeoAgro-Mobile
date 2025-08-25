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

  // Отслеживаем изменения в URL для обновления активной вкладки
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dataType = searchParams.get('data_type');
    console.log('URL changed, dataType:', dataType);
    
    if (dataType) {
      setActiveTab(dataType);
    } else {
      setActiveTab('all');
    }
  }, [location.search]);

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
          console.log('API Response for region detail:', data);
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
          // Для отклонённых используем статистику rejected c фильтром по региону
          let rejectedUrl = `${API_BASE_URL2}api/statistics/rejected/?region=${id}`;
          const queryParams = new URLSearchParams();
          if (estDate) queryParams.append('est_date', estDate);
          if (plantationType) queryParams.append('plantation_type', plantationType);
          const qs = queryParams.toString();
          if (qs) rejectedUrl += `&${qs}`;

          const rejected = await fetch(rejectedUrl, {
            headers: { Authorization: `Bearer ${authState.accessToken}` },
          });
          if (!rejected.ok) throw new Error(`HTTP error! status: ${rejected.status}`);
          const rejectedData = await rejected.json();

          // Агрегация по районам из rejected_by_district_types + rejected_subsidies_by_district (если есть)
          const districtStats = {};
          if (Array.isArray(rejectedData.rejected_by_district_types)) {
            rejectedData.rejected_by_district_types.forEach(d => {
              const name = d.district__name;
              if (!name) return;
              if (!districtStats[name]) {
                districtStats[name] = {
                  total_area: 0,
                  total_plantations: 0,
                  planted_area: 0,
                  investment: { local: 0, foreign: 0 },
                  subsidy: { subsidy_count: 0, total_subsidy: 0 },
                  bogs_count: 0, bogs_area: 0,
                  uzumzors_count: 0, uzumzors_area: 0,
                  issiqxonas_count: 0, issiqxonas_area: 0,
                };
              }
              // Количество субъектов берём как сумма типов
              const count = Number(d.bogs_count || 0) + Number(d.uzumzors_count || 0) + Number(d.issiqxonas_count || 0);
              districtStats[name].total_plantations += count;
              // Общая площадь района как сумма площадей типов (bogs/uzumzors/issiqxonas)
              const totalArea = Number(d.bogs_area || 0) + Number(d.uzumzors_area || 0) + Number(d.issiqxonas_area || 0);
              districtStats[name].total_area += totalArea;
              // Сохраняем разрез по типам
              districtStats[name].bogs_count += Number(d.bogs_count || 0);
              districtStats[name].bogs_area += Number(d.bogs_area || 0);
              districtStats[name].uzumzors_count += Number(d.uzumzors_count || 0);
              districtStats[name].uzumzors_area += Number(d.uzumzors_area || 0);
              districtStats[name].issiqxonas_count += Number(d.issiqxonas_count || 0);
              districtStats[name].issiqxonas_area += Number(d.issiqxonas_area || 0);
            });
          }

          if (Array.isArray(rejectedData.rejected_subsidies_by_district)) {
            rejectedData.rejected_subsidies_by_district.forEach(s => {
              const name = s.plantation__district__name;
              if (!name || !districtStats[name]) return;
              districtStats[name].subsidy.subsidy_count += Number(s.beneficiary_count || 0);
              districtStats[name].subsidy.total_subsidy += Number(s.total_amount || 0);
            });
          }

          if (Array.isArray(rejectedData.rejected_investments_by_district)) {
            rejectedData.rejected_investments_by_district.forEach(inv => {
              const name = inv.plantation__district__name;
              if (!name) return;
              if (!districtStats[name]) {
                districtStats[name] = {
                  total_area: 0,
                  total_plantations: 0,
                  planted_area: 0,
                  investment: { local: 0, foreign: 0 },
                  subsidy: { subsidy_count: 0, total_subsidy: 0 },
                };
              }
              districtStats[name].investment.local += Number(inv.local || 0);
              districtStats[name].investment.foreign += Number(inv.foreign || 0);
            });
          }

          data = {
            data: districtStats,
            totals: {
              total_area: Object.values(districtStats).reduce((s, d) => s + (d.total_area || 0), 0),
              total_plantations: Object.values(districtStats).reduce((s, d) => s + (d.total_plantations || 0), 0),
              total_investment: Object.values(districtStats).reduce((s, d) => s + ((d.investment.local || 0) + (d.investment.foreign || 0)), 0),
              total_subsidy: Object.values(districtStats).reduce((s, d) => s + (d.subsidy.total_subsidy || 0), 0),
            },
            meta: {
              total_rejected_fruitarea: Number(rejectedData.total_rejected_fruitarea || 0),
            }
          };
        } else {
          // Для модерации используем новый API: только ожидающие проверки
          const plantationsUrl = `${API_BASE_URL2}api/plantations/moderation/`;
          
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
        console.log('Setting statistics data:', data);
        // Проверяем структуру данных и преобразуем если нужно
        console.log('Raw API data:', data);
        
        // Если данные приходят в формате { district1: {...}, district2: {...} }
        // то нужно обернуть их в объект с полем data
        let processedData = data;
        if (data && typeof data === 'object' && !data.data && !data.fruits_by_name) {
          // Это данные районов, оборачиваем в правильную структуру
          processedData = { data: data };
        }
        
        console.log('Processed data:', processedData);
        setStatistics(processedData);
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
  console.log('Processing statistics for table:', statistics);
  console.log('Active tab:', activeTab);
  
  const tableData = Object.entries(statistics.data || {}).map(
    ([district, data]) => {
      console.log(`Processing district ${district}:`, data);
              return {
        key: district,
        district,
        total_area: data.total_area,
        total_plantations: data.plantation_count || data.total_plantations || 0,
        planted_area: data.planted_area,
        investment_local: data.investment.local,
        investment_foreign: data.investment.foreign,
        investment_total: (data.investment.local || 0) + (data.investment.foreign || 0),
        subsidy_count: data.subsidy.subsidy_count,
        total_subsidy: data.subsidy.total_subsidy,
        bogs_count: data.bogs_count || 0,
        bogs_area: data.bogs_area || 0,
        uzumzors_count: data.uzumzors_count || 0,
        uzumzors_area: data.uzumzors_area || 0,
        issiqxonas_count: data.issiqxonas_count || 0,
        issiqxonas_area: data.issiqxonas_area || 0,
      };
    }
  );

  // Calculate totals for summary cards
  const totals = Object.values(statistics.data || {}).reduce(
    (acc, curr) => ({
      total_area: (acc.total_area || 0) + curr.total_area,
      total_plantations: (acc.total_plantations || 0) + (curr.plantation_count || curr.total_plantations || 0),
      planted_area: (acc.planted_area || 0) + (curr.planted_area || 0),
      total_investment: (acc.total_investment || 0) + ((curr.investment.local || 0) + (curr.investment.foreign || 0)),
      total_subsidy: (acc.total_subsidy || 0) + curr.subsidy.total_subsidy,
    }),
    {}
  );

  // Если вкладка rejected, подменяем planted_area на тотал из API
  if (activeTab === 'rejected' && statistics.meta?.total_rejected_fruitarea !== undefined) {
    totals.planted_area = Number(statistics.meta.total_rejected_fruitarea || 0);
  }

  // Add total row
  const totalRow = {
    key: "total",
    district: "Jami",
    total_area: totals.total_area,
    total_plantations: totals.total_plantations,
    planted_area: totals.planted_area,
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

  const columns = [
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
          title: <span style={textLight}>Subyektlar soni</span>,
          dataIndex: "total_plantations",
          key: "total_plantations",
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Ekilgan maydoni (GA)</span>,
          dataIndex: "planted_area",
          key: "planted_area",
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    ...(activeTab === 'rejected' ? [
      {
        title: <span style={textLight}>Turlari (rad etilgan)</span>,
        children: [
          { title: <span style={textLight}>Bog'lar — soni</span>, dataIndex: 'bogs_count', key: 'bogs_count', render: (v)=> <span style={textLight}>{v||0}</span> },
          { title: <span style={textLight}>Bog'lar — maydon (GA)</span>, dataIndex: 'bogs_area', key: 'bogs_area', render: (v)=> <span style={textLight}>{Number(v||0).toFixed(1)}</span> },
          { title: <span style={textLight}>Uzumzorlar — soni</span>, dataIndex: 'uzumzors_count', key: 'uzumzors_count', render: (v)=> <span style={textLight}>{v||0}</span> },
          { title: <span style={textLight}>Uzumzorlar — maydon (GA)</span>, dataIndex: 'uzumzors_area', key: 'uzumzors_area', render: (v)=> <span style={textLight}>{Number(v||0).toFixed(1)}</span> },
          { title: <span style={textLight}>Issiqxonalar — soni</span>, dataIndex: 'issiqxonas_count', key: 'issiqxonas_count', render: (v)=> <span style={textLight}>{v||0}</span> },
          { title: <span style={textLight}>Issiqxonalar — maydon (GA)</span>, dataIndex: 'issiqxonas_area', key: 'issiqxonas_area', render: (v)=> <span style={textLight}>{Number(v||0).toFixed(1)}</span> },
        ],
      }
    ] : []),
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
            {console.log('Current activeTab:', activeTab)}
            <button
              onClick={() => {
                console.log('Clicking on Barcha planatsiyalar tab');
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
                console.log('Clicking on Tasdiqlangan tab');
                const searchParams = new URLSearchParams(location.search);
                searchParams.set('data_type', 'approved');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}?${queryString}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-300 hover:bg-gray-500'
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
                  : 'bg-gray-300 hover:bg-gray-500'
              }`}
            >
              Rad etilgan
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
                  {activeTab === 'approved' ? 'Tasdiqlangan maydon' : 'Jami maydon'}
                </span>}
                value={totals.total_area}
                suffix="GA"
                precision={1}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          {activeTab === 'rejected' && (
            <Col xs={12} md={6}>
              <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
                <Statistic
                  title={<span style={{ color: '#9ca3af' }}>Ekilgan maydon (GA)</span>}
                  value={totals.planted_area}
                  suffix="GA"
                  precision={1}
                  valueStyle={{ color: '#e5e7eb' }}
                />
              </Card>
            </Col>
          )}
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>
                  {activeTab === 'approved' ? 'Tasdiqlangan subyektlar' : 'Subyektlar soni'}
                </span>}
                value={totals.total_plantations}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                    title={<span style={{ color: '#9ca3af' }}>
                      {activeTab === 'approved' ? 'Tasdiqlangan investitsiyalar' : 'Jami investitsiyalar'}
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
                      {activeTab === 'approved' ? 'Tasdiqlangan subsidiyalar' : 'Jami subsidiyalar'}
                    </span>}
                value={totals.total_subsidy}
                precision={0}
                formatter={(value) => `${Number(value).toLocaleString()} UZS`}
                valueStyle={{ color: '#e5e7eb' }}
              />
            </Card>
          </Col>
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
