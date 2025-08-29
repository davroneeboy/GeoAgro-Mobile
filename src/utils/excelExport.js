import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Форматирование чисел с разделителями тысяч
const formatNumber = (value) => {
  if (value === null || value === undefined) return '0';
  return Number(value).toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  });
};

// Форматирование валюты
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0 UZS';
  return `${Number(value).toLocaleString('ru-RU')} UZS`;
};

// Генерация колонок для обычных табов (all, approved, rejected)
const generateStandardColumns = (isRegionPage = false, activeTab = 'all') => {
  if (isRegionPage) {
    const fruitAreaKey = activeTab === 'approved' ? 'total_approved_fruitarea' : 'total_fruitarea';
    const fruitAreaHeader = activeTab === 'approved' ? 'Tasdiqlangan ekilgan maydoni (GA)' : 'Ekilgan maydoni (GA)';
    return [
      { header: 'Viloyat', key: 'region', width: 20 },
      { header: 'Umumiy maydon (GA)', key: 'total_area', width: 15 },
      { header: 'Plantatsiyalar soni', key: 'total_plantations', width: 15 },
      { header: fruitAreaHeader, key: fruitAreaKey, width: 18 },
      { header: 'Bog\'lar soni', key: 'bogs_count', width: 15 },
      { header: 'Bog\'lar maydoni (GA)', key: 'bogs_area', width: 20 },
      { header: 'Uzumzorlar soni', key: 'uzumzors_count', width: 15 },
      { header: 'Uzumzorlar maydoni (GA)', key: 'uzumzors_area', width: 20 },
      { header: 'Issiqxonalar soni', key: 'issiqxonas_count', width: 15 },
      { header: 'Issiqxonalar maydoni (GA)', key: 'issiqxonas_area', width: 20 },
      { header: 'O\'rtacha hosildorlik', key: 'avg_fertility', width: 20 },
      { header: 'Mahalliy investitsiyalar (UZS)', key: 'investment_local', width: 25 },
      { header: 'Chet el investitsiyalari (UZS)', key: 'investment_foreign', width: 25 },
      { header: 'Subsidiya soni', key: 'subsidy_count', width: 15 },
      { header: 'Jami subsidiyalar (UZS)', key: 'total_subsidy', width: 25 }
    ];
  } else {
    return [
      { header: 'Tuman', key: 'district', width: 20 },
      { header: 'Umumiy maydon (GA)', key: 'total_area', width: 15 },
      { header: 'Plantatsiyalar soni', key: 'total_plantations', width: 15 },
      { header: "Ekilgan maydoni (GA)", key: 'planted_area', width: 18 },
      { header: 'Eskirgan (GA)', key: 'outdated_ga', width: 15 },
      { header: 'Past hosildorlik - Soni', key: 'low_fertility_count', width: 20 },
      { header: 'Past hosildorlik - Maydon (GA)', key: 'low_fertility_area', width: 25 },
      { header: 'Yuqori hosildorlik - Soni', key: 'high_fertility_count', width: 20 },
      { header: 'Yuqori hosildorlik - Maydon (GA)', key: 'high_fertility_area', width: 25 },
      { header: 'Sug\'orish maydoni (GA)', key: 'irrigation_area', width: 20 },
      { header: 'Sug\'orish soni', key: 'irrigation_count', width: 15 },
      { header: 'Mahalliy investitsiyalar (UZS)', key: 'investment_local', width: 25 },
      { header: 'Chet el investitsiyalari (UZS)', key: 'investment_foreign', width: 25 },
      { header: 'Jami investitsiyalar (UZS)', key: 'investment_total', width: 25 },
      { header: 'Subsidiya soni', key: 'subsidy_count', width: 15 },
      { header: 'Jami subsidiyalar (UZS)', key: 'total_subsidy', width: 25 }
    ];
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

// Форматирование данных для Excel
const formatDataForExcel = (tableData, activeTab, isRegionPage = false) => {
  if (activeTab === 'fruits') {
    return tableData.map(row => ({
      'fruit__name': row.fruit__name || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'plantation_count': row.plantation_count || 0,
      'avg_fertility_score': formatNumber(row.avg_fertility_score),
      'outdated_area': formatNumber(row.outdated_area),
      'low_fertility_area': formatNumber(row.low_fertility_area),
      'high_fertility_area': formatNumber(row.high_fertility_area)
    }));
  } else if (isRegionPage) {
    const fruitAreaKey = activeTab === 'approved' ? 'total_approved_fruitarea' : 'total_fruitarea';
    return tableData.map(row => ({
      'region': row.region || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'total_plantations': row.total_plantations || 0,
      [fruitAreaKey]: formatNumber(activeTab === 'approved' ? row.total_approved_fruitarea : row.total_fruitarea),
      'bogs_count': row.bogs_count || 0,
      'bogs_area': formatNumber(row.bogs_area),
      'uzumzors_count': row.uzumzors_count || 0,
      'uzumzors_area': formatNumber(row.uzumzors_area),
      'issiqxonas_count': row.issiqxonas_count || 0,
      'issiqxonas_area': formatNumber(row.issiqxonas_area),
      'avg_fertility': formatNumber(row.avg_fertility),
      'investment_local': formatCurrency(row.investment_local),
      'investment_foreign': formatCurrency(row.investment_foreign),
      'subsidy_count': row.subsidy_count || 0,
      'total_subsidy': formatCurrency(row.total_subsidy)
    }));
  } else {
    return tableData.map(row => ({
      'district': row.district || 'Noma\'lum',
      'total_area': formatNumber(row.total_area),
      'total_plantations': row.total_plantations || 0,
      'planted_area': formatNumber(row.planted_area),
      'outdated_ga': formatNumber(row.outdated_ga),
      'low_fertility_count': row.low_fertility_count || 0,
      'low_fertility_area': formatNumber(row.low_fertility_area),
      'high_fertility_count': row.high_fertility_count || 0,
      'high_fertility_area': formatNumber(row.high_fertility_area),
      'irrigation_area': formatNumber(row.irrigation_area),
      'irrigation_count': row.irrigation_count || 0,
      'investment_local': formatCurrency(row.investment_local),
      'investment_foreign': formatCurrency(row.investment_foreign),
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
  } else if (isRegionPage) {
    const fruitAreaKey = activeTab === 'approved' ? 'total_approved_fruitarea' : 'total_fruitarea';
    const fruitAreaVal = activeTab === 'approved' ? totals.total_approved_fruitarea : (totals.total_fruitarea || totals.planted_area);
    return {
      'region': 'JAMI',
      'total_area': formatNumber(totals.total_area),
      'total_plantations': totals.total_plantations || 0,
      [fruitAreaKey]: formatNumber(fruitAreaVal),
      'bogs_count': totals.bogs_count || 0,
      'bogs_area': formatNumber(totals.bogs_area),
      'uzumzors_count': totals.uzumzors_count || 0,
      'uzumzors_area': formatNumber(totals.uzumzors_area),
      'issiqxonas_count': totals.issiqxonas_count || 0,
      'issiqxonas_area': formatNumber(totals.issiqxonas_area),
      'avg_fertility': formatNumber(totals.fertility_stats?.average_score || 0),
      'investment_local': formatCurrency(totals.investment_local),
      'investment_foreign': formatCurrency(totals.investment_foreign),
      'subsidy_count': totals.subsidy_count || 0,
      'total_subsidy': formatCurrency(totals.total_subsidy)
    };
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
      'investment_local': formatCurrency(totals.total_investment),
      'investment_foreign': '-',
      'investment_total': formatCurrency(totals.total_investment),
      'subsidy_count': '-',
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
    summaryData.push(['Mevali maydon:', `${formatNumber(totals.total_fruitarea || totals.total_area)} GA`]);
    summaryData.push(['Mevali turlari:', totals.total_fruits_count || totals.total_plantations || 0]);
    summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
  } else if (isRegionPage) {
    summaryData.push(['Jami maydon:', `${formatNumber(totals.total_area)} GA`]);
    summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
    summaryData.push(['Bog\'lar soni:', totals.bogs_count || 0]);
    summaryData.push(['Bog\'lar maydoni:', `${formatNumber(totals.bogs_area)} GA`]);
    summaryData.push(['Uzumzorlar soni:', totals.uzumzors_count || 0]);
    summaryData.push(['Uzumzorlar maydoni:', `${formatNumber(totals.uzumzors_area)} GA`]);
    summaryData.push(['Issiqxonalar soni:', totals.issiqxonas_count || 0]);
    summaryData.push(['Issiqxonalar maydoni:', `${formatNumber(totals.issiqxonas_area)} GA`]);
    summaryData.push(['O\'rtacha hosildorlik:', `${formatNumber(totals.fertility_stats?.average_score || 0)} ball`]);
    summaryData.push(['Past hosildorlik maydoni:', `${formatNumber(totals.fertility_stats?.low_fertility_area || 0)} GA`]);
    summaryData.push(['Yuqori hosildorlik maydoni:', `${formatNumber(totals.fertility_stats?.high_fertility_area || 0)} GA`]);
    summaryData.push(['Jami investitsiyalar:', formatCurrency(totals.investment_local + totals.investment_foreign)]);
    summaryData.push(['Jami subsidiyalar:', formatCurrency(totals.total_subsidy)]);
  } else {
    summaryData.push(['Jami maydon:', `${formatNumber(totals.total_area)} GA`]);
    summaryData.push(['Plantatsiyalar soni:', totals.total_plantations || 0]);
    summaryData.push(['Eskirgan maydon:', `${formatNumber(totals.outdated_ga)} GA`]);
    summaryData.push(['Jami investitsiyalar:', formatCurrency(totals.total_investment)]);
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
      { header: 'Plantatsiyalar (jami)', key: 'total_plantations', width: 20 },
      { header: 'Tasdiqlangan', key: 'approved_plantations', width: 18 },
      { header: 'Umumiy maydon (GA)', key: 'total_area', width: 20 },
      { header: 'Ekilgan maydon (GA)', key: 'planted_area', width: 20 },
      { header: 'Tasdiqlash (%)', key: 'approve_percent', width: 18 },
    ];

    const formatted = (rows || []).map(r => ({
      name: r.name || '',
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