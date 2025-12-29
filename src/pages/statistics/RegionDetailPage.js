import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Table, Card, Row, Col, Spin, Alert, Statistic, Button, message } from "antd";
import StatisticsLayout from "../../layouts/StatisticsLayout";
import { API_BASE_URL2 } from "../../config";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import AuthContext from "../../context/AuthContext";
import { exportToExcel } from "../../utils/excelExport";

const REGION_NAMES = {
  12: "QQR",
  2: "Andijon",
  3: "Buxoro",
  5: "Jizzax",
  6: "Qashqadaryo",
  7: "Navoiy",
  8: "Namangan",
  9: "Samarqand",
  11: "Surxondaryo",
  10: "Sirdaryo",
  1: "Toshkent",
  4: "Farg‘ona",
  13: "Xorazm",
};

// Функция для получения названия района по ID региона
const getDistrictNameByRegionId = (regionId) => {
  // Маппинг region ID -> district name
  const districtNames = {
    1: "Toshkent",
    2: "Andijon",
    3: "Buxoro",
    4: "Farg'ona",
    5: "Jizzax",
    6: "Qashqadaryo",
    7: "Navoiy",
    8: "Namangan",
    9: "Samarqand",
    10: "Sirdaryo",
    11: "Surxondaryo",
    12: "Qoraqalpog'iston",
    13: "Xorazm"
  };

  return districtNames[regionId] || `Tuman_${regionId}`;
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
  const [districtNameToId, setDistrictNameToId] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, order: 'ascend' });

  // Грузим справочник районов 1 раз
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL2}api/districts/`, {
          headers: { Authorization: `Bearer ${authState.accessToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json?.results) ? json.results : (Array.isArray(json) ? json : []);
          const map = {};
          items.forEach(d => { if (d?.name && d?.id) map[d.name] = d.id; });
          setDistrictNameToId(map);
        }
      } catch { }
    })();
  }, [authState.accessToken]);

  // Отслеживаем изменения в URL для обновления активной вкладки
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const dataType = searchParams.get('data_type');

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
        // RBAC: glava regiona vidit tol'ko svoy region
        const isHead = String(authState?.userRole) === 'headof_region';
        const myRegion = String(authState?.regionId || '');
        const targetRegion = String(id || '');
        const qs = location?.search || '';
        if (isHead && myRegion && targetRegion && myRegion !== targetRegion) {
          navigate(`/statistics/regions/${myRegion}${qs}`, { replace: true });
          return;
        }
        const allowedId = (isHead && myRegion) ? myRegion : id;

        // Читаем фильтры из URL параметров
        const searchParams = new URLSearchParams(location.search);
        const estDate = searchParams.get('est_date');
        const plantationType = searchParams.get('plantation_type');
        const regions = searchParams.get('regions');
        const dataType = searchParams.get('data_type');



        let data;

        if (!dataType || dataType === 'all') {
          // Для всех плантаций используем новый API статистики
          let url = `${API_BASE_URL2}api/statistics/regions/${allowedId}/`;
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

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${authState.accessToken}` }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          data = await response.json();

          // Обрабатываем данные для all - новая структура API v2.0
          if (Array.isArray(data)) {
            let totalData = null;
            const dataMap = {};


            data.forEach((item, index) => {
              const districtId = item.district_id?.toString();
              const districtName = item.district_name;


              if (districtId === "TOTAL") {
                // Сохраняем данные TOTAL для строки "Jami"

                totalData = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              } else if (districtName) {
                // Обычные районы
                console.log(`Processing district ${districtName}:`, {
                  total_area: item.total_area,
                  low_fertility: item.low_fertility,
                  high_fertility: item.high_fertility,
                  irrigation: item.irrigation
                });

                dataMap[districtName] = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              }
            });

            console.log('Final processed all data:', { dataMap: Object.keys(dataMap), totalData });
            data = { data: dataMap, totalData: totalData };
          }
        } else if (dataType === 'approved') {
          // Для подтвержденных используем новый API endpoint
          let approvedUrl = `${API_BASE_URL2}api/statistics/regions/${allowedId}/approved/`;
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
            approvedUrl += `?${queryParams.toString()}`;
          }

          const response = await fetch(approvedUrl, {
            headers: { Authorization: `Bearer ${authState.accessToken}` }
          });
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          data = await response.json();


          // Обрабатываем данные для approved - новая структура API v2.0
          if (Array.isArray(data)) {
            const dataMap = {};
            let totalData = null;

            console.log('Processing approved data:', data.length, 'items');

            data.forEach((item, index) => {
              const districtId = item.district_id?.toString();
              const districtName = item.district_name;

              console.log(`Processing approved item ${index}:`, { districtId, districtName, total_area: item.total_area });

              if (districtId === "TOTAL") {
                // Сохраняем данные TOTAL для строки "Jami"
                console.log('Processing approved TOTAL row:', {
                  total_area: item.total_area,
                  total_plantations: item.total_plantations,
                  low_fertility: item.low_fertility,
                  high_fertility: item.high_fertility,
                  irrigation: item.irrigation
                });

                totalData = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              } else if (districtName) {
                // Обычные районы
                console.log(`Processing approved district ${districtName}:`, {
                  total_area: item.total_area,
                  low_fertility: item.low_fertility,
                  high_fertility: item.high_fertility,
                  irrigation: item.irrigation
                });

                dataMap[districtName] = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              }
            });

            console.log('Final processed approved data:', { dataMap: Object.keys(dataMap), totalData });
            data = { data: dataMap, totalData: totalData };
          }
        } else if (dataType === 'rejected') {
          // Для отклонённых используем новый API формат
          let rejectedUrl = `${API_BASE_URL2}api/statistics/regions/${allowedId}/rejected/`;
          const queryParams = new URLSearchParams();
          if (estDate) queryParams.append('est_date', estDate);
          if (plantationType) queryParams.append('plantation_type', plantationType);
          if (regions) queryParams.append('regions', regions);
          const qs = queryParams.toString();
          if (qs) rejectedUrl += `?${qs}`;

          const rejected = await fetch(rejectedUrl, {
            headers: { Authorization: `Bearer ${authState.accessToken}` },
          });
          if (!rejected.ok) throw new Error(`HTTP error! status: ${rejected.status}`);
          const rejectedData = await rejected.json();

          // Обрабатываем данные для rejected - новая структура API v2.0
          if (Array.isArray(rejectedData)) {
            const dataMap = {};
            let totalData = null;

            console.log('Processing rejected data:', rejectedData.length, 'items');

            rejectedData.forEach((item, index) => {
              const districtId = item.district_id?.toString();
              const districtName = item.district_name;

              console.log(`Processing rejected item ${index}:`, {
                districtId,
                districtName,
                total_area: item.total_area,
                irrigation: item.irrigation,
                irrigation_area: item.irrigation?.area,
                irrigation_count: item.irrigation?.count
              });

              if (districtId === "TOTAL") {
                // Сохраняем данные TOTAL для строки "Jami"
                console.log('Processing rejected TOTAL row:', {
                  total_area: item.total_area,
                  total_plantations: item.total_plantations,
                  low_fertility: item.low_fertility,
                  high_fertility: item.high_fertility,
                  irrigation: item.irrigation,
                  irrigation_area: item.irrigation?.area,
                  irrigation_count: item.irrigation?.count
                });

                totalData = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              } else if (districtName) {
                // Обычные районы
                console.log(`Processing rejected district ${districtName}:`, {
                  total_area: item.total_area,
                  low_fertility: item.low_fertility,
                  high_fertility: item.high_fertility,
                  irrigation: item.irrigation
                });

                dataMap[districtName] = {
                  total_area: Number(item.total_area || 0),
                  plantation_count: Number(item.total_plantations || 0),
                  planted_area: Number(item.planted_area || 0),
                  not_used_area: Number(item.not_used_area || 0),
                  farmers_count: Number(item.farmers_count || 0),
                  investment: {
                    local: Number(item.investment?.local || 0),
                    foreign: Number(item.investment?.foreign || 0),
                  },
                  subsidy: {
                    subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                    total_subsidy: Number(item.subsidy?.total_subsidy || 0),
                  },
                  outdated_ga: Number(item.outdated_ga || 0),
                  low_fertility: {
                    count: Number(item.low_fertility?.count || 0),
                    area: Number(item.low_fertility?.area || 0),
                  },
                  high_fertility: {
                    count: Number(item.high_fertility?.count || 0),
                    area: Number(item.high_fertility?.area || 0),
                  },
                  irrigation: {
                    area: Number(item.irrigation?.area || 0),
                    count: Number(item.irrigation?.count || 0),
                  },
                  bogs_count: Number(item.bogs_count || 0),
                  bogs_area: Number(item.bogs_area || 0),
                  uzumzors_count: Number(item.uzumzors_count || 0),
                  uzumzors_area: Number(item.uzumzors_area || 0),
                  district_id: item.district_id || null,
                  // Новые поля из API
                  approved_plantations: Number(item.approved_plantations || 0),
                  pending_plantations: Number(item.pending_plantations || 0),
                  rejected_plantations: Number(item.rejected_plantations || 0),
                  plantation_conditions: item.plantation_conditions || {},
                  agricultural_report: item.agricultural_report || {},
                  bogs_report: item.bogs_report || {},
                  uzumzor_report: item.uzumzor_report || {},
                  subsidy_report: item.subsidy_report || {},
                  // Plan data
                  plan_total_ga: Number(item.plan?.total_ga_plan || 0),
                  plan_total_count: Number(item.plan?.total_count_plan || 0),
                  plan_boglar_ga: Number(item.plan?.boglar_ga_plan || 0),
                  plan_boglar_count: Number(item.plan?.boglar_count_plan || 0),
                  plan_uzumzor_ga: Number(item.plan?.uzumzor_ga_plan || 0),
                  plan_uzumzor_count: Number(item.plan?.uzumzor_count_plan || 0),
                };
              }
            });

            console.log('Final processed rejected data:', { dataMap: Object.keys(dataMap), totalData });
            data = { data: dataMap, totalData: totalData };
          }
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
                subsidy: { subsidy_count: 0, total_subsidy: 0 },
                district_id: plantation.district?.id,
              };
            }
            // запоминаем district_id, если появился
            if (!districtStats[districtName].district_id && plantation.district?.id) {
              districtStats[districtName].district_id = plantation.district.id;
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
        // Проверяем структуру данных и преобразуем если нужно

        // Новый формат API: массив объектов по районам
        if (Array.isArray(data)) {
          const dataMap = {};
          data.forEach((item) => {
            const districtName = item.district || `District_${item.district_id || ''}`;
            dataMap[districtName] = {
              total_area: Number(item.total_area || 0),
              plantation_count: Number(item.plantation_count || 0),
              planted_area: Number(item.planted_area || 0),
              // Инвестиции и субсидии приходят вложенными объектами
              investment: {
                local: Number(item.investment?.local || 0),
                foreign: Number(item.investment?.foreign || 0),
              },
              subsidy: {
                subsidy_count: Number(item.subsidy?.subsidy_count || 0),
                total_subsidy: Number(item.subsidy?.total_subsidy || 0),
              },
              // Дополнительные поля (если понадобятся в будущем)
              outdated_ga: Number(item.outdated_ga || 0),
              low_fertility: {
                count: Number(item.low_fertility?.count || 0),
                area: Number(item.low_fertility?.area || 0),
              },
              high_fertility: {
                count: Number(item.high_fertility?.count || 0),
                area: Number(item.high_fertility?.area || 0),
              },
              irrigation: {
                area: Number(item.irrigation?.area || 0),
                count: Number(item.irrigation?.count || 0),
              },
              // Turlar bo'yicha ko'rsatkichlar
              bogs_count: Number(item.bogs_count || 0),
              bogs_area: Number(item.bogs_area || 0),
              uzumzors_count: Number(item.uzumzors_count || 0),
              uzumzors_area: Number(item.uzumzors_area || 0),
              issiqxonas_count: Number(item.issiqxonas_count || 0),
              issiqxonas_area: Number(item.issiqxonas_area || 0),
              district_id: item.district_id || null,
            };
          });
          data = { data: dataMap };
        }

        // Если данные приходят в формате { district1: {...}, district2: {...} }
        // то нужно обернуть их в объект с полем data
        let processedData = data;
        if (data && typeof data === 'object' && !data.data && !data.fruits_by_name && !data.by_region) {
          // Это данные районов, оборачиваем в правильную структуру
          // НО НЕ для вкладки "all", где есть by_region
          processedData = { data: data };
        }

        setStatistics(processedData);
      } catch (err) {
        if (err?.response?.status === 403) {
          setError("403 Forbidden: Siz ushbu viloyat statistikalarini ko'ra olmaysiz");
        } else {
          setError(err.message);
        }
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
      let exportData = tableData;
      // Для вкладки "all" исключаем строку Jami из Excel
      if (activeTab === 'all') {
        exportData = (tableData || []).filter(row => row.key !== 'total');
      }
      const regionName = REGION_NAMES[id] || `Region_${id}`;
      const filename = `${regionName}_${activeTab}_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Экспортируем
      const success = await exportToExcel(exportData, totals, activeTab, regionName, filename, true);

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

  // Transform data for table

  let tableData;

  if (activeTab === 'all') {
    // Для вкладки "all" обрабатываем данные в любом формате

    if (statistics?.by_region && Array.isArray(statistics.by_region)) {
      // Если есть by_region, используем его

      tableData = statistics.by_region.map((item, index) => {
        const districtName = item.plantation__district__name || getDistrictNameByRegionId(item.plantation__district__region);

        // Находим данные об инвестициях и субсидиях для этого региона
        const investmentData = statistics.investments_by_region?.find(inv => inv.plantation__district__region === item.plantation__district__region);
        const subsidyData = statistics.subsidies_by_region?.find(sub => sub.plantation__district__region === item.plantation__district__region);
        const typeData = statistics.by_region_types?.find(type => type.district__region === item.plantation__district__region);

        // Проверяем, что значения не undefined/null
        const totalArea = item.total_area !== undefined && item.total_area !== null ? item.total_area : 0;
        const totalPlantations = item.plantation_count !== undefined && item.plantation_count !== null ? item.plantation_count : 0;

        // Пробуем разные варианты названий поля для посаженной площади
        const plantedArea = item.planted_area !== undefined && item.planted_area !== null ? item.planted_area :
          item.fruit_area !== undefined && item.fruit_area !== null ? item.fruit_area :
            item.total_fruitarea !== undefined && item.total_fruitarea !== null ? item.total_fruitarea : 0;
        // not_used_area из API (или запасные ключи). Если нет — вычисляем как разницу
        const notUsedRaw = (item.not_used_area ?? item.not_usable_area);
        const notUsedArea = (notUsedRaw === undefined || notUsedRaw === null)
          ? Math.max(0, Number(totalArea || 0) - Number(plantedArea || 0))
          : Number(notUsedRaw || 0);

        const row = {
          key: districtName,
          district: districtName,
          total_area: totalArea,
          total_plantations: totalPlantations,
          planted_area: plantedArea,
          not_used_area: notUsedArea,
          investment_local: investmentData?.local || 0,
          investment_foreign: investmentData?.foreign || 0,
          investment_total: investmentData?.total || 0,
          subsidy_count: subsidyData?.beneficiary_count || 0,
          total_subsidy: subsidyData?.total_amount || 0,
          bogs_count: typeData?.bogs_count || 0,
          bogs_area: typeData?.bogs_area || 0,
          uzumzors_count: typeData?.uzumzors_count || 0,
          uzumzors_area: typeData?.uzumzors_area || 0,
          district_id: item.plantation__district__id || null,
          // Новые поля для статусов (для вкладки "all" могут быть недоступны)
          approved_plantations: item.approved_plantations || 0,
          pending_plantations: item.pending_plantations || 0,
          rejected_plantations: item.rejected_plantations || 0,
          farmers_count: item.farmers_count || 0,
          // Плодородие
          low_fertility_area: item.low_fertility?.area || 0,
          high_fertility_area: item.high_fertility?.area || 0,
          // Орошение
          irrigation_area: item.irrigation?.area || 0,
          irrigation_count: item.irrigation?.count || 0,
          // Эскирган
          // Эскирган
          outdated_ga: item.outdated_ga || 0,
          // Plan data
          plan_total_ga: Number(item.plan_total_ga || 0),
          plan_total_count: Number(item.plan_total_count || 0),
          plan_boglar_ga: Number(item.plan_boglar_ga || 0),
          plan_boglar_count: Number(item.plan_boglar_count || 0),
          plan_uzumzor_ga: Number(item.plan_uzumzor_ga || 0),
          plan_uzumzor_count: Number(item.plan_uzumzor_count || 0),
        };

        return row;
      });
    } else if (statistics?.data && typeof statistics.data === 'object') {
      // Если есть data, но нет by_region, создаем данные из доступных полей

      // Создаем массив районов из доступных данных
      const districts = Object.keys(statistics.data);
      tableData = districts.map(districtName => {
        const districtData = statistics.data[districtName];



        const computedNotUsed = (districtData.not_used_area ?? districtData.not_usable_area);
        const fallbackNotUsed = (computedNotUsed === undefined || computedNotUsed === null)
          ? Math.max(0, Number(districtData.total_area || 0) - Number(districtData.planted_area || 0))
          : Number(computedNotUsed || 0);

        const row = {
          key: districtName,
          district: districtName,
          total_area: districtData.total_area || 0,
          total_plantations: districtData.plantation_count || 0,
          planted_area: districtData.planted_area || 0,
          not_used_area: fallbackNotUsed,
          investment_local: districtData.investment?.local || 0,
          investment_foreign: districtData.investment?.foreign || 0,
          investment_total: (districtData.investment?.local || 0) + (districtData.investment?.foreign || 0),
          subsidy_count: districtData.subsidy?.subsidy_count || 0,
          total_subsidy: districtData.subsidy?.total_subsidy || 0,
          bogs_count: districtData.bogs_count || 0,
          bogs_area: districtData.bogs_area || 0,
          uzumzors_count: districtData.uzumzors_count || 0,
          uzumzors_area: districtData.uzumzors_area || 0,
          outdated_ga: districtData.outdated_ga || 0,
          low_fertility_count: districtData.low_fertility?.count || 0,
          low_fertility_area: districtData.low_fertility?.area || 0,
          high_fertility_count: districtData.high_fertility?.count || 0,
          high_fertility_area: districtData.high_fertility?.area || 0,
          irrigation_area: districtData.irrigation?.area || 0,
          irrigation_count: districtData.irrigation?.count || 0,
          district_id: districtData.district_id,
          // Новые поля для статусов
          approved_plantations: districtData.approved_plantations || 0,
          pending_plantations: districtData.pending_plantations || 0,
          rejected_plantations: districtData.rejected_plantations || 0,
          farmers_count: districtData.farmers_count || 0,
          // Plan data
          plan_total_ga: Number(districtData.plan_total_ga || 0),
          plan_total_count: Number(districtData.plan_total_count || 0),
          plan_boglar_ga: Number(districtData.plan_boglar_ga || 0),
          plan_boglar_count: Number(districtData.plan_boglar_count || 0),
          plan_uzumzor_ga: Number(districtData.plan_uzumzor_ga || 0),
          plan_uzumzor_count: Number(districtData.plan_uzumzor_count || 0),
        };

        return row;
      });
    } else {
      tableData = [];
    }

  } else {
    // Для других вкладок обрабатываем данные как обычно
    tableData = Object.entries(statistics?.data || {}).map(
      ([district, data]) => {


        const row = {
          key: district,
          district,
          total_area: data.total_area,
          total_plantations: data.plantation_count || data.total_plantations || 0,
          planted_area: data.planted_area,
          not_used_area: (data.not_used_area ?? data.not_usable_area ?? 0),
          outdated_ga: data.outdated_ga || 0,
          investment_local: data.investment?.local || 0,
          investment_foreign: data.investment?.foreign || 0,
          investment_total: (data.investment?.local || 0) + (data.investment?.foreign || 0),
          subsidy_count: data.subsidy?.subsidy_count || 0,
          total_subsidy: data.subsidy?.total_subsidy || 0,
          bogs_count: data.bogs_count || 0,
          bogs_area: data.bogs_area || 0,
          uzumzors_count: data.uzumzors_count || 0,
          uzumzors_area: data.uzumzors_area || 0,
          district_id: data.district_id,
          // Новые поля для статусов
          approved_plantations: data.approved_plantations || 0,
          pending_plantations: data.pending_plantations || 0,
          rejected_plantations: data.rejected_plantations || 0,
          farmers_count: data.farmers_count || 0,
          // Плодородие
          low_fertility_area: data.low_fertility?.area || 0,
          high_fertility_area: data.high_fertility?.area || 0,
          // Орошение
          irrigation_area: data.irrigation?.area || 0,
          irrigation_count: data.irrigation?.count || 0,
          // Plan data
          plan_total_ga: Number(data.plan_total_ga || 0),
          plan_total_count: Number(data.plan_total_count || 0),
          plan_boglar_ga: Number(data.plan_boglar_ga || 0),
          plan_boglar_count: Number(data.plan_boglar_count || 0),
          plan_uzumzor_ga: Number(data.plan_uzumzor_ga || 0),
          plan_uzumzor_count: Number(data.plan_uzumzor_count || 0),
        };

        return row;
      }
    );
  }

  const sortedTableData = React.useMemo(() => {
    if (!sortConfig?.field) return tableData;
    const collator = new Intl.Collator('ru', { sensitivity: 'base' });
    const getVal = (row) => {
      switch (sortConfig.field) {
        case 'district':
          return row.district || '';
        case 'total_area':
          return Number(row.total_area || 0);
        case 'total_plantations':
          return Number(row.total_plantations || 0);
        case 'farmers_count':
          return Number(row.farmers_count || 0);
        case 'planted_area':
          return Number(row.planted_area || 0);
        case 'not_used_area':
          return Number(row.not_used_area || 0);
        case 'bogs_count':
          return Number(row.bogs_count || 0);
        case 'bogs_area':
          return Number(row.bogs_area || 0);
        case 'uzumzors_count':
          return Number(row.uzumzors_count || 0);
        case 'uzumzors_area':
          return Number(row.uzumzors_area || 0);
        case 'investment_local':
          return Number(row.investment_local || 0);
        case 'investment_foreign':
          return Number(row.investment_foreign || 0);
        case 'investment_total':
          return Number(row.investment_total || 0);
        case 'subsidy_count':
          return Number(row.subsidy_count || 0);
        case 'total_subsidy':
          return Number(row.total_subsidy || 0);
        case 'approved_plantations':
          return Number(row.approved_plantations || 0);
        case 'pending_plantations':
          return Number(row.pending_plantations || 0);
        case 'rejected_plantations':
          return Number(row.rejected_plantations || 0);
        case 'low_fertility_area':
          return Number(row.low_fertility_area || 0);
        case 'high_fertility_area':
          return Number(row.high_fertility_area || 0);
        case 'irrigation_area':
          return Number(row.irrigation_area || 0);
        case 'irrigation_count':
          return Number(row.irrigation_count || 0);
        case 'outdated_ga':
          return Number(row.outdated_ga || 0);
        default:
          return '';
      }
    };
    const rows = [...tableData];
    rows.sort((a, b) => {
      const aVal = getVal(a);
      const bVal = getVal(b);
      let res;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        res = aVal - bVal;
      } else {
        res = collator.compare(String(aVal ?? ''), String(bVal ?? ''));
      }
      return sortConfig.order === 'descend' ? -res : res;
    });
    return rows;
  }, [tableData, sortConfig]);

  // Calculate totals for summary cards
  let totals;

  if (activeTab === 'all') {
    // Для вкладки "all" рассчитываем итоги из любых доступных данных

    if (statistics?.by_region && Array.isArray(statistics.by_region)) {
      // Если есть by_region, используем его

      totals = statistics.by_region.reduce(
        (acc, curr) => ({
          total_area: (acc.total_area || 0) + (curr.total_area || 0),
          total_plantations: (acc.total_plantations || 0) + (curr.plantation_count || 0),
          planted_area: (acc.planted_area || 0) + (curr.planted_area || 0),
          total_investment: 0, // Будет рассчитано отдельно
          total_subsidy: 0, // Будет рассчитано отдельно
          farmers_count: (acc.farmers_count || 0) + (curr.farmers_count || 0),
          // Добавляем поля для совместимости с экспортом
          investment_local: 0,
          investment_foreign: 0,
          investment_total: 0,
          subsidy_count: 0,
        }),
        {}
      );

      // Добавляем итоги по инвестициям и субсидиям
      if (statistics.investments_by_region) {
        totals.investment_local = statistics.investments_by_region.reduce((sum, inv) => sum + (inv.local || 0), 0);
        totals.investment_foreign = statistics.investments_by_region.reduce((sum, inv) => sum + (inv.foreign || 0), 0);
        totals.investment_total = statistics.investments_by_region.reduce((sum, inv) => sum + (inv.total || 0), 0);
        totals.total_investment = totals.investment_total;
      }

      if (statistics.subsidies_by_region) {
        totals.subsidy_count = statistics.subsidies_by_region.reduce((sum, sub) => sum + (sub.beneficiary_count || 0), 0);
        totals.total_subsidy = statistics.subsidies_by_region.reduce((sum, sub) => sum + (sub.total_amount || 0), 0);
      }
    } else if (statistics?.data && typeof statistics.data === 'object') {
      // Если есть data, рассчитываем из него
      totals = Object.values(statistics.data).reduce(
        (acc, curr) => ({
          total_area: (acc.total_area || 0) + (curr.total_area || 0),
          total_plantations: (acc.total_plantations || 0) + (curr.plantation_count || 0),
          planted_area: (acc.planted_area || 0) + (curr.planted_area || 0),
          total_investment: (acc.total_investment || 0) + ((curr.investment?.local || 0) + (curr.investment?.foreign || 0)),
          total_subsidy: (acc.total_subsidy || 0) + (curr.subsidy?.total_subsidy || 0),
          farmers_count: (acc.farmers_count || 0) + (curr.farmers_count || 0),
          // Добавляем поля для совместимости с экспортом
          investment_local: (acc.investment_local || 0) + (curr.investment?.local || 0),
          investment_foreign: (acc.investment_foreign || 0) + (curr.investment?.foreign || 0),
          investment_total: (acc.investment_total || 0) + ((curr.investment?.local || 0) + (curr.investment?.foreign || 0)),
          subsidy_count: (acc.subsidy_count || 0) + (curr.subsidy?.subsidy_count || 0),
        }),
        {}
      );
    } else {
      totals = {
        total_area: 0,
        total_plantations: 0,
        planted_area: 0,
        total_investment: 0,
        total_subsidy: 0,
        farmers_count: 0,
        investment_local: 0,
        investment_foreign: 0,
        investment_total: 0,
        subsidy_count: 0,
      };
    }
  } else {
    // Для других вкладок рассчитываем итоги как обычно
    totals = Object.values(statistics?.data || {}).reduce(
      (acc, curr) => ({
        total_area: (acc.total_area || 0) + curr.total_area,
        total_plantations: (acc.total_plantations || 0) + (curr.plantation_count || curr.total_plantations || 0),
        planted_area: (acc.planted_area || 0) + (curr.planted_area || 0),
        total_investment: (acc.total_investment || 0) + ((curr.investment?.local || 0) + (curr.investment?.foreign || 0)),
        total_subsidy: (acc.total_subsidy || 0) + (curr.subsidy?.total_subsidy || 0),
        farmers_count: (acc.farmers_count || 0) + (curr.farmers_count || 0),
        // Добавляем поля для совместимости с экспортом
        investment_local: (acc.investment_local || 0) + (curr.investment?.local || 0),
        investment_foreign: (acc.investment_foreign || 0) + (curr.investment?.foreign || 0),
        investment_total: (acc.investment_total || 0) + ((curr.investment?.local || 0) + (curr.investment?.foreign || 0)),
        subsidy_count: (acc.subsidy_count || 0) + (curr.subsidy?.subsidy_count || 0),
      }),
      {}
    );
  }

  // Если вкладка rejected, подменяем planted_area на тотал из API
  if (activeTab === 'rejected' && statistics?.meta?.total_rejected_fruitarea !== undefined) {
    totals.planted_area = Number(statistics?.meta?.total_rejected_fruitarea || 0);
  }

  // Add total row
  let totalRow;

  if (activeTab === 'all' || activeTab === 'approved' || activeTab === 'rejected') {
    // Для вкладки "all" используем данные TOTAL из API, если есть
    if (statistics?.totalData) {
      totalRow = {
        key: "total",
        district: "Jami",
        total_area: statistics.totalData.total_area,
        total_plantations: statistics.totalData.plantation_count,
        farmers_count: statistics.totalData.farmers_count || 0,
        planted_area: statistics.totalData.planted_area,
        not_used_area: (statistics.totalData.not_used_area ?? statistics.totalData.not_usable_area ?? 0),
        investment_local: statistics.totalData.investment?.local || 0,
        investment_foreign: statistics.totalData.investment?.foreign || 0,
        investment_total: (statistics.totalData.investment?.local || 0) + (statistics.totalData.investment?.foreign || 0),
        subsidy_count: statistics.totalData.subsidy?.subsidy_count || 0,
        total_subsidy: statistics.totalData.subsidy?.total_subsidy || 0,
        bogs_count: statistics.totalData.bogs_count || 0,
        bogs_area: statistics.totalData.bogs_area || 0,
        uzumzors_count: statistics.totalData.uzumzors_count || 0,
        uzumzors_area: statistics.totalData.uzumzors_area || 0,
        outdated_ga: statistics.totalData.outdated_ga || 0,
        low_fertility_count: statistics.totalData.low_fertility?.count || 0,
        low_fertility_area: statistics.totalData.low_fertility?.area || 0,
        high_fertility_count: statistics.totalData.high_fertility?.count || 0,
        high_fertility_area: statistics.totalData.high_fertility?.area || 0,
        irrigation_area: statistics.totalData.irrigation?.area || 0,
        irrigation_count: statistics.totalData.irrigation?.count || 0,
        // Plan data
        plan_total_ga: Number(statistics.totalData.plan_total_ga || 0),
        plan_total_count: Number(statistics.totalData.plan_total_count || 0),
        plan_boglar_ga: Number(statistics.totalData.plan_boglar_ga || 0),
        plan_boglar_count: Number(statistics.totalData.plan_boglar_count || 0),
        plan_uzumzor_ga: Number(statistics.totalData.plan_uzumzor_ga || 0),
        plan_uzumzor_count: Number(statistics.totalData.plan_uzumzor_count || 0),
      };
    } else {
      // Если нет данных TOTAL, не показываем строку Jami
      totalRow = null;
    }
  }

  // Add total row to tableData
  // Дополнительные итоги по turlari va eskitgan maydon
  if (totalRow) {
    const sumField = (field) => sortedTableData.reduce((acc, r) => acc + Number(r[field] || 0), 0);
    totalRow.bogs_count = sumField('bogs_count');
    totalRow.bogs_area = sumField('bogs_area');
    totalRow.uzumzors_count = sumField('uzumzors_count');
    totalRow.uzumzors_area = sumField('uzumzors_area');
    totalRow.uzumzors_area = sumField('uzumzors_area');
    totalRow.outdated_ga = sumField('outdated_ga');
    // Plan totals
    totalRow.plan_total_ga = sumField('plan_total_ga');
    totalRow.plan_total_count = sumField('plan_total_count');
    totalRow.plan_boglar_ga = sumField('plan_boglar_ga');
    totalRow.plan_boglar_count = sumField('plan_boglar_count');
    totalRow.plan_uzumzor_ga = sumField('plan_uzumzor_ga');
    totalRow.plan_uzumzor_count = sumField('plan_uzumzor_count');
  }

  const dataWithTotal = totalRow ? [...sortedTableData, totalRow] : sortedTableData;

  const textLight = { color: '#e5e7eb' };

  // Базовые колонки
  const baseColumns = [
    {
      title: <span style={textLight}>Tuman</span>,
      dataIndex: "district",
      key: "district",
      fixed: "left",
      width: 150,
      sorter: true,
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortConfig.field === 'district' ? sortConfig.order : null,
      render: (text, record) => (
        <span
          style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal", cursor: record.key !== 'total' ? 'pointer' : 'default', textDecoration: record.key !== 'total' ? 'underline' : 'none' }}
          onClick={() => {
            if (record.key === 'total') return;
            // Переход на статистику фермеров по району (только при наличии id)
            const did = record.district_id || districtNameToId[text];
            if (!did) {
              message.warning("Tuman ID topilmadi");
              return;
            }
            navigate(`/statistics/districts/${did}/farmers`, { state: { districtName: text } });
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: <span style={textLight}>Umumiy maydon</span>,
      children: [
        {
          title: <span style={{ color: '#94a3b8' }}>Plan (GA)</span>,
          dataIndex: "plan_total_ga",
          key: "plan_total_ga",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'plan_total_ga' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#94a3b8' }}>{Number(value || 0).toFixed(1)}</span>,
        },
        {
          title: <span style={{ color: '#94a3b8' }}>Plan (Soni)</span>,
          dataIndex: "plan_total_count",
          key: "plan_total_count",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'plan_total_count' ? sortConfig.order : null,
          render: (value) => <span style={{ color: '#94a3b8' }}>{Number(value || 0)}</span>,
        },
        {
          title: <span style={textLight}>Jami (GA)</span>,
          dataIndex: "total_area",
          key: "total_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'total_area' ? sortConfig.order : null,
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
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'total_plantations' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Fermerlar soni</span>,
          dataIndex: "farmers_count",
          key: "farmers_count",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'farmers_count' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {value || 0}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Ekilgan maydoni (GA)</span>,
          dataIndex: "planted_area",
          key: "planted_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'planted_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Yaroqsiz maydon (GA)</span>,
          dataIndex: "not_used_area",
          key: "not_used_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'not_used_area' ? sortConfig.order : null,
          render: (value, record) => {
            const n = Number(value) || 0;
            let formatted;
            if (n > 0 && n < 0.001) formatted = (0).toFixed(1); // 0.0 для очень малых значений
            else if (n > 0 && n < 0.1) formatted = n.toFixed(3);
            else formatted = n.toFixed(1);
            return (
              <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
                {formatted}
              </span>
            );
          },
        },
        {
          title: <span style={textLight}>Eskirgan (GA)</span>,
          dataIndex: 'outdated_ga',
          key: 'outdated_ga',
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'outdated_ga' ? sortConfig.order : null,
          render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span>
        },
      ],
    },
    {
      title: <span style={textLight}>Bog'lar</span>,
      children: [
        { title: <span style={{ color: '#94a3b8' }}>Plan (Soni)</span>, dataIndex: 'plan_boglar_count', key: 'plan_boglar_count', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'plan_boglar_count' ? sortConfig.order : null, render: (v) => <span style={{ color: '#94a3b8' }}>{v || 0}</span> },
        { title: <span style={{ color: '#94a3b8' }}>Plan (GA)</span>, dataIndex: 'plan_boglar_ga', key: 'plan_boglar_ga', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'plan_boglar_ga' ? sortConfig.order : null, render: (v) => <span style={{ color: '#94a3b8' }}>{Number(v || 0).toFixed(1)}</span> },
        { title: <span style={textLight}>Soni</span>, dataIndex: 'bogs_count', key: 'bogs_count', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'bogs_count' ? sortConfig.order : null, render: (v) => <span style={textLight}>{v || 0}</span> },
        { title: <span style={textLight}>Maydon (GA)</span>, dataIndex: 'bogs_area', key: 'bogs_area', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'bogs_area' ? sortConfig.order : null, render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span> },
      ],
    },
    {
      title: <span style={textLight}>Uzumzorlar</span>,
      children: [
        { title: <span style={{ color: '#94a3b8' }}>Plan (Soni)</span>, dataIndex: 'plan_uzumzor_count', key: 'plan_uzumzor_count', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'plan_uzumzor_count' ? sortConfig.order : null, render: (v) => <span style={{ color: '#94a3b8' }}>{v || 0}</span> },
        { title: <span style={{ color: '#94a3b8' }}>Plan (GA)</span>, dataIndex: 'plan_uzumzor_ga', key: 'plan_uzumzor_ga', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'plan_uzumzor_ga' ? sortConfig.order : null, render: (v) => <span style={{ color: '#94a3b8' }}>{Number(v || 0).toFixed(1)}</span> },
        { title: <span style={textLight}>Soni</span>, dataIndex: 'uzumzors_count', key: 'uzumzors_count', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'uzumzors_count' ? sortConfig.order : null, render: (v) => <span style={textLight}>{v || 0}</span> },
        { title: <span style={textLight}>Maydon (GA)</span>, dataIndex: 'uzumzors_area', key: 'uzumzors_area', sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: sortConfig.field === 'uzumzors_area' ? sortConfig.order : null, render: (v) => <span style={textLight}>{Number(v || 0).toFixed(1)}</span> },
      ],
    },
    {
      title: <span style={textLight}>Unumdorlik</span>,
      children: [
        {
          title: <span style={textLight}>Past unumdorlik</span>,
          dataIndex: "low_fertility_area",
          key: "low_fertility_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'low_fertility_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Yuqori unumdorlik</span>,
          dataIndex: "high_fertility_area",
          key: "high_fertility_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'high_fertility_area' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toFixed(1)}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Tomchilab sug'orish</span>,
      children: [
        {
          title: <span style={textLight}>Maydon (GA)</span>,
          dataIndex: "irrigation_area",
          key: "irrigation_area",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'irrigation_area' ? sortConfig.order : null,
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
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'irrigation_count' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {value || 0}
            </span>
          ),
        },
      ],
    },
    {
      title: <span style={textLight}>Investitsiyalar</span>,
      children: [
        {
          title: <span style={textLight}>Mahalliy (UZS)</span>,
          dataIndex: "investment_local",
          key: "investment_local",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'investment_local' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
        {
          title: <span style={textLight}>Xorijiy (USD)</span>,
          dataIndex: "investment_foreign",
          key: "investment_foreign",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'investment_foreign' ? sortConfig.order : null,
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
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'investment_total' ? sortConfig.order : null,
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
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'subsidy_count' ? sortConfig.order : null,
          render: (value) => <span style={textLight}>{value}</span>,
        },
        {
          title: <span style={textLight}>Jami summa</span>,
          dataIndex: "total_subsidy",
          key: "total_subsidy",
          sorter: true,
          sortDirections: ['ascend', 'descend'],
          sortOrder: sortConfig.field === 'total_subsidy' ? sortConfig.order : null,
          render: (value, record) => (
            <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal" }}>
              {(value || 0).toLocaleString()}
            </span>
          ),
        },
      ],
    },
  ];

  // Колонка Status только для вкладки "all"
  const statusColumn = activeTab === 'all' ? [{
    title: <span style={textLight}>Holat</span>,
    children: [
      {
        title: <span style={textLight}>Tasdiqlangan</span>,
        dataIndex: "approved_plantations",
        key: "approved_plantations",
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder: sortConfig.field === 'approved_plantations' ? sortConfig.order : null,
        render: (value, record) => (
          <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal", color: '#10b981' }}>
            {value || 0}
          </span>
        ),
      },
      {
        title: <span style={textLight}>Kutilmoqda</span>,
        dataIndex: "pending_plantations",
        key: "pending_plantations",
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder: sortConfig.field === 'pending_plantations' ? sortConfig.order : null,
        render: (value, record) => (
          <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal", color: '#f59e0b' }}>
            {value || 0}
          </span>
        ),
      },
      {
        title: <span style={textLight}>Rad etilgan</span>,
        dataIndex: "rejected_plantations",
        key: "rejected_plantations",
        sorter: true,
        sortDirections: ['ascend', 'descend'],
        sortOrder: sortConfig.field === 'rejected_plantations' ? sortConfig.order : null,
        render: (value, record) => (
          <span style={{ ...textLight, fontWeight: record.key === "total" ? "bold" : "normal", color: '#ef4444' }}>
            {value || 0}
          </span>
        ),
      },
    ],
  }] : [];

  // Объединяем все колонки
  const columns = [
    ...baseColumns,
    ...statusColumn,
  ];

  if (loading) return <Spin size="large" />;
  if (error) return <Alert message={error} type="error" />;
  if (!statistics) return <Alert message="Ma'lumot topilmadi" type="info" />;

  return (
    <StatisticsLayout>
      <div className="p-3 sm:p-4" style={{ background: '#111827', minHeight: '100vh' }}>
        <div className="flex items-center mb-3 sm:mb-4">
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
          <h1 className="text-lg sm:text-xl font-bold ml-2 sm:ml-4 text-white">
            {REGION_NAMES[id]} viloyati statistikasi
          </h1>
        </div>

        {/* Вкладки для переключения типов данных */}
        <Card className="mb-3 sm:mb-4" bodyStyle={{ background: '#1f2937', padding: 12 }} style={{ background: '#1f2937', border: '1px solid #374151' }}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                const searchParams = new URLSearchParams(location.search);
                searchParams.delete('data_type');
                const queryString = searchParams.toString();
                navigate(`/statistics/regions/${id}${queryString ? `?${queryString}` : ''}`);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'approved'
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
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'rejected'
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
        <Row gutter={[12, 12]} className="mb-3 sm:mb-4">
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
                  title={<span style={{ color: '#9ca3af' }}>Ekilgan maydoni (GA)</span>}
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
          <Col xs={12} md={6}>
            <Card style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb' }} bodyStyle={{ padding: 16 }}>
              <Statistic
                title={<span style={{ color: '#9ca3af' }}>Fermerlar soni</span>}
                value={totals.farmers_count || 0}
                precision={0}
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
            rowClassName={(record) => {
              if (record.key === 'total') {
                return 'total-row-dark';
              }
              return '';
            }}
            onChange={(_, __, sorter) => {
              const s = Array.isArray(sorter) ? sorter[0] : sorter;
              const order = s?.order || null;
              const fieldKey = s?.columnKey || null;
              if (!order || !fieldKey) {
                setSortConfig({ field: null, order: 'ascend' });
              } else {
                setSortConfig({ field: fieldKey, order });
              }
            }}
          />
        </div>
      </div>
    </StatisticsLayout>
  );
};

export default RegionDetailPage;
