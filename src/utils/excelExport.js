import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Форматирование чисел для Excel - возвращаем числовые значения
const formatNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (isNaN(num)) return 0;
  return num;
};

// Форматирование валюты для Excel - возвращаем числовые значения
const formatCurrency = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (isNaN(num)) return 0;
  return num;
};

// Форматирование числа без валюты для инвестиций для Excel - возвращаем числовые значения
const formatInvestment = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  if (isNaN(num)) return 0;
  return num;
};

// Генерация колонок для обычных табов (all, approved, rejected)
const generateStandardColumns = (isRegionPage = false, activeTab = 'all') => {
  // Специальные типы таблиц
  if (activeTab === 'fruits') {
    return generateFruitsColumns();
  } else if (activeTab === 'controllers') {
    return generateControllersColumns();
  } else if (activeTab === 'fruit_detail') {
    return generateFruitDetailColumns();
  }
  if (isRegionPage) {
    const fruitAreaHeader = activeTab === 'approved' ? 'Tasdiqlangan ekilgan maydoni (GA)' : 'Ekilgan maydoni (GA)';
    return [
      { header: 'Viloyat', key: 'district', width: 20 },
      { header: 'Umumiy maydon (GA)', key: 'total_area', width: 15 },
      { header: 'Plantatsiyalar soni', key: 'total_plantations', width: 15 },
      { header: fruitAreaHeader, key: 'planted_area', width: 18 },
      { header: 'Yaroqsiz maydon (GA)', key: 'not_used_area', width: 18 },
      { header: 'Bog\'lar soni', key: 'bogs_count', width: 15 },
      { header: 'Bog\'lar maydoni (GA)', key: 'bogs_area', width: 20 },
      { header: 'Uzumzorlar soni', key: 'uzumzors_count', width: 15 },
      { header: 'Uzumzorlar maydoni (GA)', key: 'uzumzors_area', width: 20 },
      { header: 'Issiqxonalar soni', key: 'issiqxonas_count', width: 15 },
              { header: 'Issiqxonalar maydoni (GA)', key: 'issiqxonas_area', width: 20 },
        { header: 'Mahalliy investitsiyalar', key: 'investment_local', width: 25 },
      { header: 'Chet el investitsiyalar', key: 'investment_foreign', width: 25 },
      { header: 'Subsidiya soni', key: 'subsidy_count', width: 15 },
      { header: 'Jami subsidiyalar (UZS)', key: 'total_subsidy', width: 25 }
    ];
    } else {
    // Для детальных таблиц районов генерируем колонки в зависимости от activeTab
    if (isRegionPage && activeTab === 'all') {
      // Для вкладки "all" используем стандартную структуру
      return [
        { header: 'Viloyat', key: 'district', width: 20 },
        { header: 'Umumiy maydon (GA)', key: 'total_area', width: 15 },
        { header: 'Plantatsiyalar soni', key: 'total_plantations', width: 15 },
        { header: "Ekilgan maydoni (GA)", key: 'planted_area', width: 18 },
        { header: 'Yaroqsiz maydon (GA)', key: 'not_used_area', width: 18 },
        { header: 'Bog\'lar soni', key: 'bogs_count', width: 15 },
        { header: 'Bog\'lar maydoni (GA)', key: 'bogs_area', width: 20 },
        { header: 'Uzumzorlar soni', key: 'uzumzors_count', width: 15 },
        { header: 'Uzumzorlar maydoni (GA)', key: 'uzumzors_area', width: 20 },
        { header: 'Issiqxonalar soni', key: 'issiqxonas_count', width: 15 },
        { header: 'Issiqxonalar maydoni (GA)', key: 'issiqxonas_area', width: 20 },
        { header: 'Mahalliy investitsiyalar', key: 'investment_local', width: 25 },
        { header: 'Chet el investitsiyalar', key: 'investment_foreign', width: 25 },
        { header: 'Jami investitsiyalar (UZS)', key: 'investment_total', width: 25 },
        { header: 'Subsidiya soni', key: 'subsidy_count', width: 15 },
        { header: 'Jami subsidiyalar (UZS)', key: 'total_subsidy', width: 25 }
      ];
    } else {
      // Для обычных таблиц используем полную структуру
      return [
        { header: 'Tuman', key: 'district', width: 20 },
        { header: 'Umumiy maydon (GA)', key: 'total_area', width: 15 },
        { header: 'Plantatsiyalar soni', key: 'total_plantations', width: 15 },
        { header: "Ekilgan maydoni (GA)", key: 'planted_area', width: 18 },
        { header: 'Yaroqsiz maydon (GA)', key: 'not_used_area', width: 18 },
        { header: 'Eskirgan (GA)', key: 'outdated_ga', width: 15 },
        { header: 'Past hosildorlik - Soni', key: 'low_fertility_count', width: 20 },
        { header: 'Past hosildorlik - Maydon (GA)', key: 'low_fertility_area', width: 25 },
        { header: 'Yuqori hosildorlik - Soni', key: 'high_fertility_count', width: 20 },
        { header: 'Yuqori hosildorlik - Maydon (GA)', key: 'high_fertility_area', width: 25 },
        { header: 'Sug\'orish maydoni (GA)', key: 'irrigation_area', width: 20 },
        { header: 'Sug\'orish soni', key: 'irrigation_count', width: 15 },
        { header: 'Mahalliy investitsiyalar', key: 'investment_local', width: 25 },
        { header: 'Chet el investitsiyalar', key: 'investment_foreign', width: 25 },
        { header: 'Jami investitsiyalar (UZS)', key: 'investment_total', width: 25 },
        { header: 'Subsidiya soni', key: 'subsidy_count', width: 15 },
        { header: 'Jami subsidiyalar (UZS)', key: 'total_subsidy', width: 25 }
      ];
    }
  }
};

// Генерация колонок для таба "fruits"
const generateFruitsColumns = () => [
  { header: 'Meva nomi', key: 'fruit__name', width: 20 },
  { header: 'Maydon (GA)', key: 'total_area', width: 15 },
  { header: 'Plantatsiyalar soni', key: 'plantation_count', width: 15 },
  { header: 'O\'rtacha hosildorlik', key: 'avg_fertility_score', width: 20 },
  { header: 'Eskirgan maydon (GA)', key: 'outdated_area', width: 20 },
  { header: 'Past hosildorlik (GA)', key: 'low_fertility_area', width: 20 },
  { header: 'Yuqori hosildorlik (GA)', key: 'high_fertility_area', width: 20 }
];

// Генерация колонок для таба "controllers"
const generateControllersColumns = () => [
  { header: 'F.I.Sh', key: 'full_name', width: 25 },
  { header: 'Login', key: 'username', width: 20 },
  { header: 'Telefon raqami', key: 'phone_number', width: 20 },
  { header: 'Region', key: 'region', width: 15 },
  { header: 'Tuman', key: 'district', width: 20 },
  { header: 'Oxirgi kirish', key: 'last_login', width: 20 },
  { header: 'Plantatsiyalar - Umumiy', key: 'total_plantations', width: 20 },
  { header: 'Plantatsiyalar - Tasdiqlangan', key: 'approved_plantations', width: 25 },
  { header: 'Plantatsiyalar - Rad etilgan', key: 'rejected_plantations', width: 25 },
  { header: 'Plantatsiyalar - Rad etish %', key: 'rejection_rate', width: 20 },
  { header: 'KPI - Ballar', key: 'kpi_points', width: 15 },
  { header: 'KPI - Summa', key: 'kpi_amount', width: 20 }
];

// Генерация колонок для таба "fruit_detail"
const generateFruitDetailColumns = () => [
  { header: 'Nav', key: 'variety', width: 25 },
  { header: 'Umumiy maydon (GA)', key: 'total_area', width: 20 },
  { header: 'Eskirgan maydon (GA)', key: 'outdated_ga', width: 20 },
  { header: 'O\'rtacha hosildorlik', key: 'avg_fertility_score', width: 25 }
];

// Форматирование данных для Excel
const formatDataForExcel = (tableData, activeTab, isRegionPage = false) => {
  
  if (activeTab === 'fruits') {
    return tableData.map(row => ({
      'fruit__name': row.fruit || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'plantation_count': row.plantation_count || 0,
      'avg_fertility_score': formatNumber(row.avg_fertility_score),
      'outdated_area': formatNumber(row.outdated_ga),
      'low_fertility_area': formatNumber(row.low_fertility_area),
      'high_fertility_area': formatNumber(row.high_fertility_area)
    }));
  } else if (activeTab === 'controllers') {
    return tableData.map(row => {
      const plantationsStats = row.plantations_stats || {};
      const kpiCurrent = row.kpi_current || {};
      const location = row.location || {};
      
      return {
        'full_name': `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Noma\'lum',
        'username': row.username || 'Noma\'lum',
        'phone_number': row.phone_number || 'Noma\'lum',
        'region': location.region || 'Noma\'lum',
        'district': location.district || 'Noma\'lum',
        'last_login': row.last_login || 'Noma\'lum',
        'total_plantations': plantationsStats.total || 0,
        'approved_plantations': plantationsStats.approved || 0,
        'rejected_plantations': plantationsStats.rejected || 0,
        'rejection_rate': plantationsStats.rejection_rate || 0,
        'kpi_points': kpiCurrent.points || 0,
        'kpi_amount': kpiCurrent.amount || 0
      };
    });
  } else if (activeTab === 'fruit_detail') {
    return tableData.map(row => ({
      'variety': row.variety || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'outdated_ga': formatNumber(row.outdated_ga),
      'avg_fertility_score': row.key === 'total' ? '-' : formatNumber(row.avg_fertility_score)
    }));
  } else if (isRegionPage) {
    // Для детальных таблиц районов обрабатываем данные в зависимости от activeTab
    if (activeTab === 'all') {
      // Для вкладки "all" используем стандартную структуру
      const result = (tableData || []).map(row => {
        const formattedRow = {
          'district': row.district || row.region || 'Noma\'lum',
          'total_area': formatNumber(row.total_area),
          'total_plantations': row.total_plantations || 0,
          'planted_area': formatNumber(row.planted_area || row.total_fruitarea || 0),
          'not_used_area': formatNumber(row.not_used_area || 0),
          'bogs_count': row.bogs_count || 0,
          'bogs_area': formatNumber(row.bogs_area || 0),
          'uzumzors_count': row.uzumzors_count || 0,
          'uzumzors_area': formatNumber(row.uzumzors_area || 0),
          'issiqxonas_count': row.issiqxonas_count || 0,
          'issiqxonas_area': formatNumber(row.issiqxonas_area || 0),
          'investment_local': formatInvestment(row.investment_local || 0),
          'investment_foreign': formatInvestment(row.investment_foreign || 0),
          'investment_total': formatCurrency(row.investment_total || 0),
          'subsidy_count': row.subsidy_count || 0,
          'total_subsidy': formatCurrency(row.total_subsidy || 0)
        };
        return formattedRow;
      });
      return result;
    } else {

      // Для вкладок "approved" и "rejected" используем расширенную структуру
      return (tableData || []).map(row => ({
        'district': row.district || row.region || 'Noma\'lum',
        'total_area': formatNumber(row.total_area),
        'total_plantations': row.total_plantations || 0,
        'planted_area': formatNumber(row.planted_area || row.total_fruitarea || 0),
        'not_used_area': formatNumber(row.not_used_area || 0),
        'investment_local': formatInvestment(row.investment_local || 0),
        'investment_foreign': formatInvestment(row.investment_foreign || 0),
        'investment_total': formatCurrency(row.investment_total || 0),
        'subsidy_count': row.subsidy_count || 0,
        'total_subsidy': formatCurrency(row.total_subsidy || 0),
        'bogs_count': row.bogs_count || 0,
        'bogs_area': formatNumber(row.bogs_area || 0),
        'uzumzors_count': row.uzumzors_count || 0,
        'uzumzors_area': formatNumber(row.uzumzors_area || 0),
        'issiqxonas_count': row.issiqxonas_count || 0,
        'issiqxonas_area': formatNumber(row.issiqxonas_area || 0)
      }));
    }
  } else {
    return (tableData || []).map(row => ({
      'district': row.district || row.region || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'total_plantations': row.total_plantations || 0,
      'planted_area': formatNumber(row.planted_area || row.total_fruitarea || 0),
      'not_used_area': formatNumber(row.not_used_area || 0),
      'outdated_ga': formatNumber(row.outdated_ga),
      'low_fertility_count': row.low_fertility_count || 0,
      'low_fertility_area': formatNumber(row.low_fertility_area),
      'high_fertility_count': row.high_fertility_count || 0,
      'high_fertility_area': formatNumber(row.high_fertility_area),
      'irrigation_area': formatNumber(row.irrigation_area),
      'irrigation_count': row.irrigation_count || 0,
      'investment_local': formatInvestment(row.investment_local),
      'investment_foreign': formatInvestment(row.investment_foreign),
      'investment_total': formatCurrency(row.investment_total),
      'subsidy_count': row.subsidy_count || 0,
      'total_subsidy': formatCurrency(row.total_subsidy)
    }));
  }
};

// Создание итоговой строки
const createTotalRow = (totals, activeTab, isRegionPage = false) => {
  if (activeTab === 'fruits') {
    return {
      'fruit__name': 'JAMI',
      'total_area': formatNumber(totals.total_fruitarea || totals.total_area),
      'plantation_count': totals.total_plantations || 0,
      'avg_fertility_score': '-',
      'outdated_area': '-',
      'low_fertility_area': '-',
      'high_fertility_area': '-'
    };
  } else if (activeTab === 'controllers') {
    return {
      'full_name': 'JAMI',
      'username': '-',
      'phone_number': '-',
      'region': '-',
      'district': '-',
      'last_login': '-',
      'total_plantations': totals.total_plantations || 0,
      'approved_plantations': totals.approved_plantations || 0,
      'rejected_plantations': totals.rejected_plantations || 0,
      'rejection_rate': '-',
      'kpi_points': totals.kpi_points || 0,
      'kpi_amount': totals.kpi_amount || 0
    };
  } else if (activeTab === 'fruit_detail') {
    return {
      'variety': 'JAMI',
      'total_area': formatNumber(totals.total_area),
      'outdated_ga': formatNumber(totals.outdated_ga),
      'avg_fertility_score': '-'
    };
  } else if (isRegionPage) {
    // Для детальных таблиц районов обрабатываем итоги в зависимости от activeTab
    if (activeTab === 'all') {
      // Для вкладки "all" используем стандартную структуру
      return {
        'district': 'JAMI',
        'total_area': formatNumber(totals.total_area),
        'total_plantations': totals.total_plantations || 0,
        'planted_area': formatNumber(totals.planted_area || totals.total_fruitarea || 0),
        'bogs_count': totals.bogs_count || 0,
        'bogs_area': formatNumber(totals.bogs_area || 0),
        'uzumzors_count': totals.uzumzors_count || 0,
        'uzumzors_area': formatNumber(totals.uzumzors_area || 0),
        'issiqxonas_count': totals.issiqxonas_count || 0,
        'issiqxonas_area': formatNumber(totals.issiqxonas_area || 0),
        'investment_local': formatInvestment(totals.investment_local || 0),
        'investment_foreign': formatInvestment(totals.investment_foreign || 0),
        'investment_total': formatCurrency(totals.total_investment || totals.investment_total || 0),
        'subsidy_count': totals.subsidy_count || 0,
        'total_subsidy': formatCurrency(totals.total_subsidy || 0)
      };
    } else {
      // Для вкладок "approved" и "rejected" используем расширенную структуру
      return {
        'district': 'JAMI',
        'total_area': formatNumber(totals.total_area),
        'total_plantations': totals.total_plantations || 0,
        'planted_area': formatNumber(totals.planted_area || totals.total_fruitarea || 0),
        'investment_local': formatInvestment(totals.investment_local || 0),
        'investment_foreign': formatInvestment(totals.investment_foreign || 0),
        'investment_total': formatCurrency(totals.total_investment || totals.investment_total || 0),
        'subsidy_count': totals.subsidy_count || 0,
        'total_subsidy': formatCurrency(totals.total_subsidy || 0),
        'bogs_count': totals.bogs_count || 0,
        'bogs_area': formatNumber(totals.bogs_area || 0),
        'uzumzors_count': totals.uzumzors_count || 0,
        'uzumzors_area': formatNumber(totals.uzumzors_area || 0),
        'issiqxonas_count': totals.issiqxonas_count || 0,
        'issiqxonas_area': formatNumber(totals.issiqxonas_area || 0)
      };
    }
  } else {
    return {
      'district': 'JAMI',
      'total_area': formatNumber(totals.total_area),
      'total_plantations': totals.total_plantations || 0,
      'planted_area': formatNumber(totals.planted_area),
      'outdated_ga': formatNumber(totals.outdated_ga),
      'low_fertility_count': '-',
      'low_fertility_area': '-',
      'high_fertility_count': '-',
      'high_fertility_area': '-',
      'irrigation_area': '-',
      'irrigation_count': '-',
      'investment_local': formatInvestment(totals.investment_local || 0),
      'investment_foreign': formatInvestment(totals.investment_foreign || 0),
      'investment_total': formatCurrency(totals.total_investment),
      'subsidy_count': totals.subsidy_count || 0,
      'total_subsidy': formatCurrency(totals.total_subsidy)
    };
  }
};

// Создание листа с итоговой статистикой
const createSummarySheet = (totals, activeTab, regionName, isRegionPage = false) => {
  const summaryData = [];
  
  // Заголовок
  summaryData.push(['']);
  summaryData.push([`${regionName} - Summary Statistics`]);
  summaryData.push(['']);
  summaryData.push(['Export Date:', new Date().toLocaleDateString('ru-RU')]);
  summaryData.push(['Active Tab:', activeTab === 'fruits' ? 'Fruits' : 
    activeTab === 'approved' ? 'Tasdiqlangan' : 
    activeTab === 'rejected' ? 'Rad etilgan' : 'Barcha planatsiyalar']);
  summaryData.push(['']);
  
  // Статистика
  if (activeTab === 'fruits') {
    summaryData.push(['Mevali maydon:', formatNumber(totals.total_fruitarea || totals.total_area)]);
    summaryData.push(['Mevali turlari:', totals.total_fruits_count || totals.total_plantations || 0]);
    summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
  } else if (activeTab === 'controllers') {
    summaryData.push(['Jami nazoratchilar:', totals.total_plantations || 0]);
    summaryData.push(['Tasdiqlangan plantatsiyalar:', totals.approved_plantations || 0]);
    summaryData.push(['Rad etilgan plantatsiyalar:', totals.rejected_plantations || 0]);
    summaryData.push(['Jami KPI ballar:', totals.kpi_points || 0]);
    summaryData.push(['Jami KPI summa:', formatCurrency(totals.kpi_amount || 0)]);
  } else if (activeTab === 'fruit_detail') {
    summaryData.push(['Jami maydon:', formatNumber(totals.total_area)]);
    summaryData.push(['Eskirgan maydon:', formatNumber(totals.outdated_ga)]);
  } else if (isRegionPage) {
    // Для детальных таблиц районов обрабатываем итоги в зависимости от activeTab
    if (activeTab === 'all') {
      // Для вкладки "all" используем стандартную структуру
      summaryData.push(['Jami maydon:', formatNumber(totals.total_area)]);
      summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
      summaryData.push(['Ekilgan maydoni:', formatNumber(totals.planted_area || totals.total_fruitarea || 0)]);
      summaryData.push(['Bog\'lar soni:', totals.bogs_count || 0]);
      summaryData.push(['Bog\'lar maydoni:', formatNumber(totals.bogs_area)]);
      summaryData.push(['Uzumzorlar soni:', totals.uzumzors_count || 0]);
      summaryData.push(['Uzumzorlar maydoni:', formatNumber(totals.uzumzors_area)]);
      summaryData.push(['Issiqxonalar soni:', totals.issiqxonas_count || 0]);
      summaryData.push(['Issiqxonalar maydoni:', formatNumber(totals.issiqxonas_area)]);
      summaryData.push(['Mahalliy investitsiyalar:', formatCurrency(totals.investment_local || 0)]);
      summaryData.push(['Chet el investitsiyalar:', formatCurrency(totals.investment_foreign || 0)]);
      summaryData.push(['Jami investitsiyalar:', formatCurrency(totals.investment_total || 0)]);
      summaryData.push(['Subsidiya soni:', totals.subsidy_count || 0]);
      summaryData.push(['Jami subsidiyalar:', formatCurrency(totals.total_subsidy || 0)]);
    } else {
      // Для вкладок "approved" и "rejected" используем расширенную структуру
      summaryData.push(['Jami maydon:', formatNumber(totals.total_area)]);
      summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
      summaryData.push(['Ekilgan maydoni:', formatNumber(totals.planted_area || totals.total_fruitarea || 0)]);
      summaryData.push(['Bog\'lar soni:', totals.bogs_count || 0]);
      summaryData.push(['Bog\'lar maydoni:', formatNumber(totals.bogs_area)]);
      summaryData.push(['Uzumzorlar soni:', totals.uzumzors_count || 0]);
      summaryData.push(['Uzumzorlar maydoni:', formatNumber(totals.uzumzors_area)]);
      summaryData.push(['Issiqxonalar soni:', totals.issiqxonas_count || 0]);
      summaryData.push(['Issiqxonalar maydoni:', formatNumber(totals.issiqxonas_area)]);
      summaryData.push(['Mahalliy investitsiyalar:', formatCurrency(totals.investment_local || 0)]);
      summaryData.push(['Chet el investitsiyalar:', formatCurrency(totals.investment_foreign || 0)]);
      summaryData.push(['Jami investitsiyalar:', formatCurrency(totals.investment_total || 0)]);
      summaryData.push(['Subsidiya soni:', totals.subsidy_count || 0]);
      summaryData.push(['Jami subsidiyalar:', formatCurrency(totals.total_subsidy || 0)]);
    }
      } else {
      summaryData.push(['Jami maydon:', formatNumber(totals.total_area)]);
      summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
      summaryData.push(['Eskirgan maydon:', formatNumber(totals.outdated_ga)]);
      summaryData.push(['Mahalliy investitsiyalar:', formatInvestment(totals.investment_local || 0)]);
      summaryData.push(['Chet el investitsiyalar:', formatInvestment(totals.investment_foreign || 0)]);
      summaryData.push(['Jami investitsiyalar:', formatCurrency(totals.total_investment)]);
      summaryData.push(['Subsidiya soni:', totals.subsidy_count || 0]);
      summaryData.push(['Jami subsidiyalar:', formatCurrency(totals.total_subsidy)]);
    }
  
  return summaryData;
};

// Основная функция экспорта
export const exportToExcel = (tableData, totals, activeTab, regionName, filename, isRegionPage = false) => {
  try {
    // Создаем новую книгу
    const workbook = XLSX.utils.book_new();
    
    // Форматируем данные
    const formattedData = formatDataForExcel(tableData, activeTab, isRegionPage);
    
    // Добавляем итоговую строку
    const totalRow = createTotalRow(totals, activeTab, isRegionPage);
    formattedData.push(totalRow);
    
    // Получаем колонки
    const columns = activeTab === 'fruits' ? generateFruitsColumns() : generateStandardColumns(isRegionPage, activeTab);
    
    // Создаем лист с данными, принудительно задавая порядок и наличие колонок
    const headerKeys = columns.map(c => c.key);
    const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: headerKeys });
    
    // Заменяем заголовки на правильные названия
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (worksheet[address]) {
        const key = worksheet[address].v;
        const column = columns.find(col => col.key === key);
        if (column) {
          worksheet[address].v = column.header;
        }
      }
    }
    
    // Устанавливаем ширину колонок
    const columnWidths = {};
    columns.forEach(col => {
      columnWidths[col.key] = { width: col.width };
    });
    worksheet['!cols'] = Object.values(columnWidths);
    
    // Добавляем лист в книгу
    const sheetName = activeTab === 'fruits' ? 'Fruits Statistics' : 'Statistics';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Создаем лист с итоговой статистикой
    const summaryData = createSummarySheet(totals, activeTab, regionName, isRegionPage);
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    
    // Генерируем файл
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Скачиваем файл
    const finalFilename = filename || `${regionName}_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, finalFilename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
};

// Функция для экспорта с прогрессом (для больших файлов)
export const exportToExcelWithProgress = async (tableData, totals, activeTab, regionName, filename, onProgress) => {
  try {
    if (onProgress) onProgress(10, 'Preparing data...');
    
    // Форматируем данные
    const formattedData = formatDataForExcel(tableData, activeTab);
    
    if (onProgress) onProgress(30, 'Adding totals...');
    
    // Добавляем итоговую строку
    const totalRow = createTotalRow(totals, activeTab);
    formattedData.push(totalRow);
    
    if (onProgress) onProgress(50, 'Creating workbook...');
    
    // Создаем книгу
    const workbook = XLSX.utils.book_new();
    
    // Получаем колонки
    const columns = activeTab === 'fruits' ? generateFruitsColumns() : generateStandardColumns();
    
    // Создаем лист с данными, используя правильные заголовки
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    
    if (onProgress) onProgress(70, 'Formatting worksheet...');
    
    // Заменяем заголовки на правильные названия
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (worksheet[address]) {
        const key = worksheet[address].v;
        const column = columns.find(col => col.key === key);
        if (column) {
          worksheet[address].v = column.header;
        }
      }
    }
    
    // Устанавливаем ширину колонок
    const columnWidths = {};
    columns.forEach(col => {
      columnWidths[col.key] = { width: col.width };
    });
    worksheet['!cols'] = Object.values(columnWidths);
    
    // Добавляем лист в книгу
    const sheetName = activeTab === 'fruits' ? 'Fruits Statistics' : 'Statistics';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    if (onProgress) onProgress(85, 'Creating summary...');
    
    // Создаем лист с итоговой статистикой
    const summaryData = createSummarySheet(totals, activeTab, regionName);
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    
    if (onProgress) onProgress(95, 'Generating file...');
    
    // Генерируем файл
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    if (onProgress) onProgress(100, 'Downloading...');
    
    // Скачиваем файл
    const finalFilename = filename || `${regionName}_statistics_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, finalFilename);
    
    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
  }
}; 

// Экспорт таблицы фермеров по району
export const exportFarmersToExcel = (rows, districtName, filename) => {
  try {
    const workbook = XLSX.utils.book_new();

    const columns = [
      { header: 'Fermer', key: 'name', width: 30 },
      { header: 'INN', key: 'farmer_inn', width: 20 },
      { header: 'Plantatsiyalar (jami)', key: 'total_plantations', width: 20 },
      { header: 'Tasdiqlangan', key: 'approved_plantations', width: 18 },
      { header: 'Umumiy maydon (GA)', key: 'total_area', width: 20 },
      { header: 'Ekilgan maydon (GA)', key: 'planted_area', width: 20 },
      { header: 'Tasdiqlash (%)', key: 'approve_percent', width: 18 },
    ];

    const formatted = (rows || []).map(r => ({
      name: r.name || '',
      farmer_inn: r.farmer_inn || r.inn || '',
      total_plantations: Number(r.total_plantations || 0),
      approved_plantations: Number(r.approved_plantations || 0),
      total_area: Number(r.total_area || 0),
      planted_area: Number(r.planted_area || 0),
      approve_percent: Number(r.approve_percent || 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(formatted);

    // Заголовки
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (worksheet[address]) {
        const key = worksheet[address].v;
        const col = columns.find(c => c.key === key);
        if (col) worksheet[address].v = col.header;
      }
    }

    // Ширина колонок
    worksheet['!cols'] = columns.map(c => ({ width: c.width }));

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Farmers');

    // Summary лист
    const summary = [
      [''],
      [`${districtName || 'District'} — Farmers Statistics`],
      [''],
      ['Export Date:', new Date().toLocaleDateString('ru-RU')],
      ['Rows:', (rows || []).length],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, ws2, 'Summary');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const finalName = filename || `${(districtName || 'District').replace(/\s+/g, '_')}_farmers_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(blob, finalName);
    return true;
  } catch (e) {
    console.error('Farmers export error:', e);
    return false;
  }
}; 

export const exportSimpleSheet = (rows, columns, filename = 'export.xlsx', sheetName = 'Data') => {
  try {
    const workbook = XLSX.utils.book_new();
    const headerKeys = columns.map(c => c.key);
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headerKeys });
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (worksheet[address]) {
        const key = worksheet[address].v;
        const col = columns.find(col => col.key === key);
        if (col) worksheet[address].v = col.header;
      }
    }
    worksheet['!cols'] = columns.map(c => ({ width: c.width || 20 }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    return true;
  } catch (e) {
    console.error('exportSimpleSheet error:', e);
    return false;
  }
}; 