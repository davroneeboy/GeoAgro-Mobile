import React, { useState } from 'react';
import translateAction from '../../utils/moderationUtils';

// Функция для перевода названий полей на узбекский язык
function translateFieldName(fieldName) {
  const fieldTranslations = {
    'total_area': 'Jami maydon',
    'planted_area': 'Ekish maydoni',
    'empty_area': 'Bo\'sh maydon',
    'irrigation_area': 'Sug\'orish maydoni',
    'not_usable_area': 'Yaroqsiz maydon',
    'garden_established_year': 'Bog\' yili',
    'is_fertile': 'Hasil beradi',
    'fenced': 'Devor bilan o\'ralgan',
    'land_type': 'Yer turi',
    'fertility_score': 'Banitet bali',
    'polygon_area': 'Poligon maydoni',
    'total_fruitarea': 'Jami mevali maydon',
    'economic_inefficient_area': 'Iqtisodiy samarasiz maydon',
    'fruit_areas': 'Mevali hududlar',
    'investments': 'Investitsiyalar',
    'coordinates': 'Koordinatalar',
    'district': 'Tuman',
    'reservoir_count': 'Suv xovuzlari soni',
    'pump_station_count': 'Quduqlar soni',
    'irrigation_systems_count': 'Sug\'orish tizimlari soni',
    'kontur_number': 'Kontur raqami',
    'created_by': 'Yaratgan',
    'moderated_by': 'Moderatsiya qilgan',
    'is_checked': 'Tekshirilgan',
    'is_rejected': 'Rad etilgan',
    'is_deleting': 'O\'chirilmoqda',
    'plantation_created': 'Planatsiya yaratildi',
    'plantation_deleted': 'Planatsiya o\'chirildi',
    'types': 'Turlar',
    'farmer': 'Fermer',
    'images': 'Rasmlar',
    'subsidies': 'Subsidiyalar',
    'trellises': 'Shpallar',
    'reservoirs': 'Suv xovuzlari',
  };
  
  return fieldTranslations[fieldName] || fieldName;
}

// Функция для форматирования значения поля
function formatFieldValue(value, fieldName = '') {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✅' : '❌';
  if (typeof value === 'number') {
    // Для числовых полей с суффиксом area добавляем единицы измерения
    if (fieldName.includes('area') || fieldName.includes('Area')) {
      return `${value.toFixed(1)} GA`;
    }
    return value.toString();
  }
  if (typeof value === 'string') {
    if (value === '') return '—';
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    // Для специальных массивов используем расширенное форматирование
    if (['fruit_areas', 'investments', 'coordinates'].includes(fieldName)) {
      return formatArrayValue(value, fieldName);
    }
    return `[${value.length} элемент]`;
  }
  if (typeof value === 'object') {
    if (value.name) {
      // Для district показываем название и регион
      if (value.region) return `${value.name} (Region ${value.region})`;
      return value.name;
    }
    if (value.id) return `ID: ${value.id}`;
    return JSON.stringify(value);
  }
  return String(value);
}

// Функция для получения значения поля из данных
function getFieldValue(data, field) {
  if (!data) return null;
  
  // Обработка вложенных полей
  if (field.includes('.')) {
    const parts = field.split('.');
    let value = data;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }
    return value;
  }
  
  return data[field];
}

// Функция для глубокого сравнения объектов
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) {
    // Если один null/undefined, а другой нет - разные
    if (obj1 === null && obj2 === null) return true;
    if (obj1 === undefined && obj2 === undefined) return true;
    return false;
  }
  if (typeof obj1 !== typeof obj2) return false;
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    // Для массивов объектов сравниваем по содержимому, а не по порядку
    // Сортируем оба массива по строковому представлению для сравнения
    const normalize = (arr) => {
      return arr.map(item => {
        if (typeof item === 'object' && item !== null) {
          // Сортируем ключи объекта для консистентности
          const sorted = {};
          Object.keys(item).sort().forEach(key => {
            sorted[key] = item[key];
          });
          return sorted;
        }
        return item;
      }).sort((a, b) => {
        const aStr = JSON.stringify(a);
        const bStr = JSON.stringify(b);
        return aStr.localeCompare(bStr);
      });
    };
    
    const arr1Normalized = normalize(obj1);
    const arr2Normalized = normalize(obj2);
    
    return arr1Normalized.length === arr2Normalized.length &&
           arr1Normalized.every((item, index) => {
             const item1Str = JSON.stringify(item);
             const item2Str = JSON.stringify(arr2Normalized[index]);
             return item1Str === item2Str;
           });
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => deepEqual(obj1[key], obj2[key]));
}

// Функция для сравнения массивов объектов (fruit_areas, investments и т.д.)
function compareArrays(arr1, arr2) {
  // Если один не массив, а другой массив - разные
  if (!Array.isArray(arr1) && Array.isArray(arr2)) return true;
  if (Array.isArray(arr1) && !Array.isArray(arr2)) return true;
  if (!Array.isArray(arr1) && !Array.isArray(arr2)) {
    return arr1 !== arr2;
  }
  
  // Если один массив пустой, а другой нет - разные
  if (arr1.length === 0 && arr2.length > 0) return true;
  if (arr1.length > 0 && arr2.length === 0) return true;
  if (arr1.length === 0 && arr2.length === 0) return false;
  
  if (arr1.length !== arr2.length) return true;
  
  // Нормализуем массивы для сравнения (сортируем по содержимому)
  const normalize = (arr) => {
    return arr.map(item => {
      if (typeof item === 'object' && item !== null) {
        const sorted = {};
        Object.keys(item).sort().forEach(key => {
          // Для investments игнорируем id при сравнении (сравниваем только бизнес-логику)
          // Для других объектов тоже можно игнорировать id, если нужно
          if (key === 'id' && (item.invest_type !== undefined || item.investment_amount !== undefined)) {
            // Пропускаем id для investments - не добавляем в sorted
          } else {
            // Нормализуем значения
            let value = item[key];
            if (value === null || value === undefined) {
              sorted[key] = null;
            } else {
              sorted[key] = value;
            }
          }
        });
        return sorted;
      }
      return item;
    }).sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
  };
  
  const arr1Normalized = normalize(arr1);
  const arr2Normalized = normalize(arr2);
  
  if (arr1Normalized.length !== arr2Normalized.length) return true;
  
  // Сравниваем каждый элемент
  for (let i = 0; i < arr1Normalized.length; i++) {
    const item1Str = JSON.stringify(arr1Normalized[i]);
    const item2Str = JSON.stringify(arr2Normalized[i]);
    if (item1Str !== item2Str) {
      return true; // Найдены различия
    }
  }
  
  return false; // Массивы одинаковые
}

// Функция для поиска различий между old_data и new_data
function findDifferences(oldData, newData) {
  // Если оба null - нет различий
  if ((oldData === null || oldData === undefined) && (newData === null || newData === undefined)) {
    return [];
  }
  
  // Если только old_data null - это создание
  if ((oldData === null || oldData === undefined) && newData) {
    return ['plantation_created'];
  }
  
  // Если только new_data null - это удаление
  if (oldData && (newData === null || newData === undefined)) {
    return ['plantation_deleted'];
  }
  
  // Если оба не null - сравниваем
  if (oldData && newData) {
    const differences = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    allKeys.forEach(key => {
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];
      
      // Для массивов используем специальное сравнение
      if (Array.isArray(oldValue) || Array.isArray(newValue)) {
        if (compareArrays(oldValue, newValue)) {
          differences.push(key);
        }
      } else if (!deepEqual(oldValue, newValue)) {
        differences.push(key);
      }
    });
    
    return differences;
  }
  
  return [];
}

// Функция для форматирования массива объектов (fruit_areas, investments и т.д.)
function formatArrayValue(value, fieldName) {
  if (!Array.isArray(value) || value.length === 0) return '—';
  
  if (fieldName === 'fruit_areas') {
    return value.map((fa, idx) => {
      const parts = [];
      if (fa.fruit) parts.push(`Meva: ${fa.fruit}`);
      if (fa.variety) parts.push(`Nav: ${fa.variety}`);
      if (fa.area != null) parts.push(`Maydon: ${fa.area} GA`);
      if (fa.planted_year) parts.push(`Yil: ${fa.planted_year}`);
      return parts.length > 0 ? `  ${idx + 1}. ${parts.join(', ')}` : `  ${idx + 1}. [Элемент]`;
    }).join('\n') || `[${value.length} элемент]`;
  }
  
  if (fieldName === 'investments') {
    return value.map((inv, idx) => {
      const type = inv.invest_type === 1 ? 'Mahalliy' : inv.invest_type === 2 ? 'Xorijiy' : `Turi ${inv.invest_type}`;
      const amount = inv.investment_amount ? new Intl.NumberFormat('uz-UZ').format(inv.investment_amount) : '—';
      return `  ${idx + 1}. ${type}: ${amount} UZS`;
    }).join('\n') || `[${value.length} элемент]`;
  }
  
  if (fieldName === 'coordinates') {
    return value.map((coord, idx) => {
      return `  ${idx + 1}. Lat: ${coord.latitude}, Lng: ${coord.longitude}`;
    }).join('\n') || `[${value.length} элемент]`;
  }
  
  return `[${value.length} элемент]`;
}

export default function PlantationHistory({
  data,
  loading,
  error,
  action,
  setAction,
  page,
  setPage,
  pageSize,
  onReload,
  title = "Tarix (o'zgarishlar)",
}) {
  const totalPages = Math.ceil((data?.count || 0) / (data?.page_size || pageSize || 1));
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  const toggleLog = (logId) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  return (
    <div className="mt-6 mb-6 bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
        >
          <svg 
            className={`w-5 h-5 transition-transform ${isHistoryExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
          <h2 className="font-semibold text-lg">{title}</h2>
        </button>
        <div className="flex items-center gap-2">
          {onReload && (
            <button
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
              onClick={onReload}
            >
              Yuklash
            </button>
          )}
        </div>
      </div>

      {isHistoryExpanded && (
        <div className="mt-4">
          {loading && <div className="text-gray-300">Yuklanmoqda...</div>}
          {error && <div className="text-red-400">{error}</div>}

          {!loading && !error && data?.results?.length === 0 && (
            <div className="text-gray-300">Tarix bo'sh</div>
          )}

          {!loading && !error && Array.isArray(data?.results) && data.results.map((log) => {
        const isExpanded = expandedLogs.has(log.id);
        const hasOldData = log.old_data !== null && log.old_data !== undefined;
        const hasNewData = log.new_data !== null && log.new_data !== undefined;
        
        // Определяем измененные поля: сначала из changed_fields, если пусто - находим различия
        let changedFields = Array.isArray(log.changed_fields) && log.changed_fields.length > 0 
          ? log.changed_fields 
          : (hasOldData && hasNewData ? findDifferences(log.old_data, log.new_data) : []);
        
        // Если old_data и new_data оба null, но action = "update", это может быть обновление без изменений
        // В этом случае changedFields уже будет пустым, что правильно
        
        // Дополнительные проверки для массивов, если они не в changed_fields, но есть различия
        const arrayFieldsToCheck = ['fruit_areas', 'investments', 'coordinates', 'images'];
        arrayFieldsToCheck.forEach(field => {
          if (!changedFields.includes(field) && hasOldData && hasNewData) {
            const oldValue = log.old_data?.[field];
            const newValue = log.new_data?.[field];
            if (compareArrays(oldValue, newValue)) {
              changedFields.push(field);
            }
          }
        });
        
        const hasChanges = changedFields.length > 0;
        
        // Если нет изменений, но это update с null данными - не показываем детали
        const shouldShowDetails = hasChanges || (log.action === 'create' && hasNewData) || (hasOldData && hasNewData);

        return (
          <div key={log.id} className="border border-gray-600 rounded p-3 text-gray-200 bg-gray-800 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded bg-gray-700 border border-gray-600">
                  {translateAction(log.action_display || log.action)}
                </span>
                <span className="text-sm text-gray-300">{log.user_name || '—'}</span>
              </div>
              <div className="text-xs text-gray-400">
                {new Date(log.timestamp).toLocaleString("ru-RU", {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {hasChanges && (
              <div className="mt-2 text-sm">
                <span className="text-gray-400 mr-1">O'zgargan maydonlar:</span>
                <span className="text-gray-300">{changedFields.map(f => translateFieldName(f)).join(", ")}</span>
              </div>
            )}

            {log.moderation_comment && (
              <div className="mt-2 text-sm text-gray-300">
                <span className="text-gray-400 mr-1">Izoh:</span>
                {log.moderation_comment}
              </div>
            )}

            {shouldShowDetails && (
              <div className="mt-3">
                <button
                  onClick={() => toggleLog(log.id)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  {isExpanded ? 'Yashirish' : "Tafsilotlarni ko'rsatish"}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-3 border-t border-gray-600 pt-2">
                    {/* Группируем поля по категориям */}
                    {(() => {
                      const basicFields = ['total_area', 'planted_area', 'empty_area', 'irrigation_area', 'not_usable_area', 'garden_established_year', 'is_fertile', 'fenced', 'land_type', 'fertility_score', 'polygon_area', 'total_fruitarea', 'economic_inefficient_area'];
                      const fruitFields = ['fruit_areas'];
                      const investFields = ['investments'];
                      const coordFields = ['coordinates'];
                      const districtFields = ['district'];
                      const otherFields = ['reservoir_count', 'pump_station_count', 'irrigation_systems_count', 'kontur_number', 'created_by', 'moderated_by', 'is_checked', 'is_rejected', 'is_deleting'];
                      
                      const basicChanges = changedFields.filter(f => basicFields.includes(f));
                      const fruitChanges = changedFields.filter(f => fruitFields.includes(f));
                      const investChanges = changedFields.filter(f => investFields.includes(f));
                      const coordChanges = changedFields.filter(f => coordFields.includes(f));
                      const districtChanges = changedFields.filter(f => districtFields.includes(f));
                      const otherChanges = changedFields.filter(f => otherFields.includes(f) || ![...basicFields, ...fruitFields, ...investFields, ...coordFields, ...districtFields].includes(f));
                      
                      return (
                        <>
                          {/* Основная информация */}
                          {basicChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-blue-400 mb-2">Asosiy ma'lumotlar</div>
                              <div className="space-y-2">
                                {basicChanges.map((field) => {
                                  const oldValue = hasOldData ? getFieldValue(log.old_data, field) : null;
                                  const newValue = hasNewData ? getFieldValue(log.new_data, field) : null;
                                  
                                  return (
                                    <div key={field} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                      <div className="text-xs font-semibold text-gray-400 mb-1">{translateFieldName(field)}</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-red-400 text-xs">Eski:</span>
                                          <div className="text-gray-300 mt-0.5 whitespace-pre-wrap">
                                            {formatFieldValue(oldValue, field)}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-green-400 text-xs">Yangi:</span>
                                          <div className="text-gray-300 mt-0.5 whitespace-pre-wrap">
                                            {formatFieldValue(newValue, field)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Mevali hududlar */}
                          {fruitChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-green-400 mb-2">Mevali hududlar</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-red-400 mb-1">Eski:</div>
                                  {hasOldData && log.old_data?.fruit_areas && Array.isArray(log.old_data.fruit_areas) && log.old_data.fruit_areas.length > 0 ? (
                                    <div className="space-y-2 text-xs">
                                      {log.old_data.fruit_areas.map((fa, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <div className="grid grid-cols-1 gap-1">
                                            <div><span className="text-gray-400">Meva:</span> <span className="text-gray-300">{fa.fruit || '—'}</span></div>
                                            <div><span className="text-gray-400">Nav:</span> <span className="text-gray-300">{fa.variety || '—'}</span></div>
                                            <div><span className="text-gray-400">Maydon:</span> <span className="text-gray-300 font-bold">{fa.area ? `${fa.area} GA` : '—'}</span></div>
                                            <div><span className="text-gray-400">Yil:</span> <span className="text-gray-300">{fa.planted_year || '—'}</span></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-green-400 mb-1">Yangi:</div>
                                  {hasNewData && log.new_data?.fruit_areas && Array.isArray(log.new_data.fruit_areas) && log.new_data.fruit_areas.length > 0 ? (
                                    <div className="space-y-2 text-xs">
                                      {log.new_data.fruit_areas.map((fa, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <div className="grid grid-cols-1 gap-1">
                                            <div><span className="text-gray-400">Meva:</span> <span className="text-gray-300">{fa.fruit || '—'}</span></div>
                                            <div><span className="text-gray-400">Nav:</span> <span className="text-gray-300">{fa.variety || '—'}</span></div>
                                            <div><span className="text-gray-400">Maydon:</span> <span className="text-gray-300 font-bold">{fa.area ? `${fa.area} GA` : '—'}</span></div>
                                            <div><span className="text-gray-400">Yil:</span> <span className="text-gray-300">{fa.planted_year || '—'}</span></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Investitsiyalar */}
                          {investChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-yellow-400 mb-2">Investitsiyalar</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-red-400 mb-1">Eski:</div>
                                  {hasOldData && log.old_data?.investments && Array.isArray(log.old_data.investments) && log.old_data.investments.length > 0 ? (
                                    <div className="space-y-2 text-xs">
                                      {log.old_data.investments.map((inv, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <div className="text-gray-300">
                                            {inv.invest_type === 1 ? 'Mahalliy' : inv.invest_type === 2 ? 'Xorijiy' : `Turi ${inv.invest_type}`}:{' '}
                                            <span className="font-bold">
                                              {inv.investment_amount ? new Intl.NumberFormat('uz-UZ').format(inv.investment_amount) : '—'} UZS
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="mt-2 pt-2 border-t border-gray-600">
                                        <div className="text-gray-400 text-xs">Jami: {new Intl.NumberFormat('uz-UZ').format(log.old_data.investments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0))} UZS</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-green-400 mb-1">Yangi:</div>
                                  {hasNewData && log.new_data?.investments && Array.isArray(log.new_data.investments) && log.new_data.investments.length > 0 ? (
                                    <div className="space-y-2 text-xs">
                                      {log.new_data.investments.map((inv, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <div className="text-gray-300">
                                            {inv.invest_type === 1 ? 'Mahalliy' : inv.invest_type === 2 ? 'Xorijiy' : `Turi ${inv.invest_type}`}:{' '}
                                            <span className="font-bold">
                                              {inv.investment_amount ? new Intl.NumberFormat('uz-UZ').format(inv.investment_amount) : '—'} UZS
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                      <div className="mt-2 pt-2 border-t border-gray-600">
                                        <div className="text-green-400 text-xs font-bold">Jami: {new Intl.NumberFormat('uz-UZ').format(log.new_data.investments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0))} UZS</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Koordinatalar */}
                          {coordChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-purple-400 mb-2">Koordinatalar</div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs text-red-400 mb-1">Eski:</div>
                                  {hasOldData && log.old_data?.coordinates && Array.isArray(log.old_data.coordinates) && log.old_data.coordinates.length > 0 ? (
                                    <div className="space-y-1 text-xs">
                                      {log.old_data.coordinates.map((coord, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <span className="text-gray-400">Lat:</span> <span className="text-gray-300">{coord.latitude}</span>{' '}
                                          <span className="text-gray-400 ml-2">Lng:</span> <span className="text-gray-300">{coord.longitude}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-xs text-green-400 mb-1">Yangi:</div>
                                  {hasNewData && log.new_data?.coordinates && Array.isArray(log.new_data.coordinates) && log.new_data.coordinates.length > 0 ? (
                                    <div className="space-y-1 text-xs">
                                      {log.new_data.coordinates.map((coord, idx) => (
                                        <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                          <span className="text-gray-400">Lat:</span> <span className="text-gray-300">{coord.latitude}</span>{' '}
                                          <span className="text-gray-400 ml-2">Lng:</span> <span className="text-gray-300">{coord.longitude}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400 text-xs">—</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tuman */}
                          {districtChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-gray-400 mb-2">Tuman</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-red-400 text-xs">Eski:</span>
                                  <div className="text-gray-300 mt-0.5">{formatFieldValue(hasOldData ? log.old_data?.district : null, 'district')}</div>
                                </div>
                                <div>
                                  <span className="text-green-400 text-xs">Yangi:</span>
                                  <div className="text-gray-300 mt-0.5">{formatFieldValue(hasNewData ? log.new_data?.district : null, 'district')}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Qo'shimcha maydonlar */}
                          {otherChanges.length > 0 && (
                            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="text-xs font-semibold text-gray-400 mb-2">Qo'shimcha maydonlar</div>
                              <div className="space-y-2">
                                {otherChanges.map((field) => {
                                  const oldValue = hasOldData ? getFieldValue(log.old_data, field) : null;
                                  const newValue = hasNewData ? getFieldValue(log.new_data, field) : null;
                                  
                                  return (
                                    <div key={field} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                      <div className="text-xs font-semibold text-gray-400 mb-1">{translateFieldName(field)}</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-red-400 text-xs">Eski:</span>
                                          <div className="text-gray-300 mt-0.5 whitespace-pre-wrap">
                                            {formatFieldValue(oldValue, field)}
                                          </div>
                                        </div>
                                        <div>
                                          <span className="text-green-400 text-xs">Yangi:</span>
                                          <div className="text-gray-300 mt-0.5 whitespace-pre-wrap">
                                            {formatFieldValue(newValue, field)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {!hasChanges && log.action === 'create' && hasNewData && (
              <div className="mt-3">
                <button
                  onClick={() => toggleLog(log.id)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  {isExpanded ? 'Yashirish' : "Tafsilotlarni ko'rsatish"}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-3 border-t border-gray-600 pt-2">
                    {/* Основная информация */}
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                      <div className="text-xs font-semibold text-blue-400 mb-2">Asosiy ma'lumotlar</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Yer turi:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.land_type, 'land_type')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Tuman:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.district, 'district')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Jami maydon:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.total_area, 'total_area')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Ekish maydoni:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.planted_area, 'planted_area')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Bo'sh maydon:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.empty_area, 'empty_area')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Sug'orish maydoni:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.irrigation_area, 'irrigation_area')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Yaroqsiz maydon:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.not_usable_area, 'not_usable_area')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Bog' yili:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.garden_established_year, 'garden_established_year')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Hasil beradi:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.is_fertile, 'is_fertile')}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Devor bilan o'ralgan:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.fenced, 'fenced')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Mevali hududlar */}
                    {log.new_data?.fruit_areas && Array.isArray(log.new_data.fruit_areas) && log.new_data.fruit_areas.length > 0 && (
                      <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                        <div className="text-xs font-semibold text-green-400 mb-2">Mevali hududlar</div>
                        <div className="space-y-2 text-xs">
                          {log.new_data.fruit_areas.map((fa, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-400">Meva:</span> <span className="text-gray-300">{fa.fruit || '—'}</span></div>
                                <div><span className="text-gray-400">Nav:</span> <span className="text-gray-300">{fa.variety || '—'}</span></div>
                                <div><span className="text-gray-400">Maydon:</span> <span className="text-gray-300 font-bold">{fa.area ? `${fa.area} GA` : '—'}</span></div>
                                <div><span className="text-gray-400">Yil:</span> <span className="text-gray-300">{fa.planted_year || '—'}</span></div>
                                {fa.kochat_soni && <div><span className="text-gray-400">Ko'chat soni:</span> <span className="text-gray-300">{fa.kochat_soni}</span></div>}
                                {fa.weight && <div><span className="text-gray-400">Og'irlik:</span> <span className="text-gray-300">{fa.weight}</span></div>}
                                {fa.hundredweight && <div><span className="text-gray-400">Sentner:</span> <span className="text-gray-300">{fa.hundredweight}</span></div>}
                                <div><span className="text-gray-400">O'ralgan:</span> <span className="text-gray-300">{fa.fenced ? '✅' : '❌'}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Investitsiyalar */}
                    {log.new_data?.investments && Array.isArray(log.new_data.investments) && log.new_data.investments.length > 0 && (
                      <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                        <div className="text-xs font-semibold text-yellow-400 mb-2">Investitsiyalar</div>
                        <div className="space-y-2 text-xs">
                          {log.new_data.investments.map((inv, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-gray-400">Turi:</span>{' '}
                                  <span className="text-gray-300">
                                    {inv.invest_type === 1 ? 'Mahalliy' : inv.invest_type === 2 ? 'Xorijiy' : `Turi ${inv.invest_type}`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Summa:</span>{' '}
                                  <span className="text-gray-300 font-bold">
                                    {inv.investment_amount ? new Intl.NumberFormat('uz-UZ').format(inv.investment_amount) : '—'} UZS
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400 font-semibold">Jami:</span>
                              <span className="text-green-400 font-bold">
                                {new Intl.NumberFormat('uz-UZ').format(
                                  log.new_data.investments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0)
                                )} UZS
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Koordinatalar */}
                    {log.new_data?.coordinates && Array.isArray(log.new_data.coordinates) && log.new_data.coordinates.length > 0 && (
                      <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                        <div className="text-xs font-semibold text-purple-400 mb-2">Koordinatalar</div>
                        <div className="space-y-1 text-xs">
                          {log.new_data.coordinates.map((coord, idx) => (
                            <div key={idx} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                              <span className="text-gray-400">Lat:</span> <span className="text-gray-300">{coord.latitude}</span>{' '}
                              <span className="text-gray-400 ml-2">Lng:</span> <span className="text-gray-300">{coord.longitude}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Qo'shimcha ma'lumotlar */}
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                      <div className="text-xs font-semibold text-gray-400 mb-2">Qo'shimcha ma'lumotlar</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Suv xovuzlari:</span>
                          <div className="text-gray-300 mt-0.5">{log.new_data?.reservoir_count || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Quduqlar:</span>
                          <div className="text-gray-300 mt-0.5">{log.new_data?.pump_station_count || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Sug'orish tizimlari:</span>
                          <div className="text-gray-300 mt-0.5">{log.new_data?.irrigation_systems_count || 0}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Jami mevali maydon:</span>
                          <div className="text-gray-300 mt-0.5">{formatFieldValue(log.new_data?.total_fruitarea, 'total_fruitarea')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

          {!loading && data?.count > (data?.page_size || pageSize) && (
            <div className="flex items-center justify-between pt-2 mt-4 border-t border-gray-600">
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 border border-gray-600 hover:bg-gray-600"
                disabled={page <= 1}
                onClick={() => setPage?.(Math.max(1, page - 1))}
              >
                Orqaga
              </button>
              <div className="text-xs text-gray-400">
                {page} / {totalPages}
              </div>
              <button
                className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 border border-gray-600 hover:bg-gray-600"
                disabled={page >= totalPages}
                onClick={() => setPage?.(page + 1)}
              >
                Oldinga
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


