import { API_BASE_URL2 } from "../config";

// Кэш по districtId, чтобы не смешивать результаты разных туманов
const plantationsCacheByDistrict = new Map();

// Дедупликация параллельных GET-запросов (in-flight cache)
const inFlightRequests = new Map();
const dedupeFetchJson = async (url, options = {}) => {
  const key = `${url}|${JSON.stringify(options)}`;
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = (async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  })();
  inFlightRequests.set(key, promise);
  try {
    const data = await promise;
    return data;
  } finally {
    inFlightRequests.delete(key);
  }
};

export function clearPlantationsCache(districtId) {
  if (typeof districtId === "number" || typeof districtId === "string") {
    plantationsCacheByDistrict.delete(Number(districtId));
  } else {
    plantationsCacheByDistrict.clear();
  }
}

export async function fetchPlantationsMap(districtId, accessToken, userRole) {
  if (!API_BASE_URL2) {
    throw new Error('API_BASE_URL2 is not defined in fetchPlantationsMap');
  }
  const key = Number(districtId);
  if (!Number.isFinite(key)) {
    return [];
  }

  if (plantationsCacheByDistrict.has(key)) {
    return plantationsCacheByDistrict.get(key);
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const data = await dedupeFetchJson(
      `${API_BASE_URL2}api/plantations/map/?district_id=${key}`,
      { headers }
    );  

    if (!data || !data.results) {
      return [];
    }

    plantationsCacheByDistrict.set(key, data.results);
    return data.results;
  } catch (error) {
    console.error("Ошибка при загрузке данных плантаций для карты:", error);

    // Фолбэк для observer: пробуем общий список плантаций
    const isAccessError = String(error?.message || '').includes('403') || String(error?.message || '').includes('404');
    if (userRole === 'observer' && isAccessError) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        // Сначала пробуем с фильтром по туману
        let data = await dedupeFetchJson(
          `${API_BASE_URL2}api/plantations/?district_id=${key}&page_size=1000`,
          { headers }
        );
        if (!data || !data.results || data.results.length === 0) {
          // Затем без фильтра (покажем хотя бы что-то)
          data = await dedupeFetchJson(
            `${API_BASE_URL2}api/plantations/?page_size=1000`,
            { headers }
          );
        }
        const results = Array.isArray(data?.results) ? data.results : [];
        plantationsCacheByDistrict.set(key, results);
        return results;
      } catch (fallbackError) {
        console.error('Fallback plantations fetch failed for observer:', fallbackError);
        return [];
      }
    }
    return [];
  }
}

// Новый эндпоинт для получения всех плантаций с расширенной фильтрацией
export async function fetchPlantationsMapAll(params = {}, accessToken) {
  if (!API_BASE_URL2) {
    throw new Error('API_BASE_URL2 is not defined in fetchPlantationsMapAll');
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const queryParams = new URLSearchParams();
    
    // Параметр status (all, approved, rejected, pending/moderation, deleting)
    // Передаем status всегда, включая 'all', чтобы API вернул все плантации
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    // Дополнительные фильтры
    if (params.is_checked !== undefined && params.is_checked !== null) {
      queryParams.append('is_checked', String(params.is_checked));
    }
    
    if (params.is_deleting !== undefined && params.is_deleting !== null) {
      queryParams.append('is_deleting', String(params.is_deleting));
    }
    
    if (params.region) {
      queryParams.append('region', params.region);
    }
    
    if (params.district_id !== undefined && params.district_id !== null) {
      queryParams.append('district_id', String(params.district_id));
    }
    
    if (params.plantation_type) {
      queryParams.append('plantation_type', String(params.plantation_type));
    }
    
    if (params.name) {
      queryParams.append('name', params.name);
    }
    
    if (params.inn) {
      queryParams.append('inn', params.inn);
    }
    
    // Пагинация
    if (params.page) {
      queryParams.append('page', String(params.page));
    }
    
    if (params.page_size) {
      queryParams.append('page_size', String(params.page_size));
    } else {
      // По умолчанию 100 записей на страницу
      queryParams.append('page_size', '100');
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_BASE_URL2}api/plantations/map/all/?${queryString}`
      : `${API_BASE_URL2}api/plantations/map/all/`;

    const data = await dedupeFetchJson(url, { headers });

    // Возвращаем полный объект с пагинацией или только results для обратной совместимости
    if (params.returnFullResponse) {
      return {
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
        results: Array.isArray(data.results) ? data.results : [],
      };
    }

    return Array.isArray(data?.results) ? data.results : [];
  } catch (error) {
    console.error("Ошибка при загрузке данных плантаций через map/all:", error);
    
    // Обработка специфичных ошибок
    const errorMessage = String(error?.message || '');
    if (errorMessage.includes('400')) {
      throw new Error('Неверные параметры запроса. Проверьте значения фильтров.');
    }
    if (errorMessage.includes('403')) {
      throw new Error('Недостаточно прав для доступа к этой информации');
    }
    if (errorMessage.includes('401')) {
      throw new Error('Требуется авторизация');
    }
    
    throw error;
  }
}

// Статистические API функции
export async function fetchRegionsStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    // Новые параметры фильтрации согласно документации
    if (params.status) queryParams.append('status', params.status);
    if (params.region_id) queryParams.append('region_id', params.region_id);
    if (params.district_id) queryParams.append('district_id', params.district_id);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики регионов:", error);
    throw error;
  }
}

export async function fetchRegionDistrictsStatistics(regionId, params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики районов региона:", error);
    throw error;
  }
}

export async function fetchRegionApprovedStatistics(regionId, params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/approved/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/approved/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики одобренных плантаций региона:", error);
    throw error;
  }
}

export async function fetchRegionRejectedStatistics(regionId, params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/rejected/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/rejected/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики отклоненных плантаций региона:", error);
    throw error;
  }
}

// Новые API функции согласно документации
export async function fetchStatisticsSummary(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/summary/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/summary/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке сводной статистики:", error);
    throw error;
  }
}

export async function fetchDistrictsStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/districts/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/districts/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики районов:", error);
    throw error;
  }
}

export async function fetchDistrictDetail(districtId, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const url = `${API_BASE_URL2}api/statistics/districts/${districtId}/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке детальной статистики района:", error);
    throw error;
  }
}

export async function fetchRegionFruitsStatistics(regionId, params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/fruits/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/fruits/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики фруктов региона:", error);
    throw error;
  }
}

export async function fetchFruitsStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/fruits/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/fruits/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики фруктов:", error);
    throw error;
  }
}

// Получение плантаций конкретного фермера для карты (без пагинации)
export async function fetchFarmerPlantations({ farmer_id, farmer_inn }, accessToken) {
  const hasId = Number.isFinite(Number(farmer_id));
  const hasInn = (
    farmer_inn !== undefined && farmer_inn !== null && String(farmer_inn).trim() !== '' &&
    Number.isFinite(Number(farmer_inn)) && Number(farmer_inn) > 0
  );
  if (!hasId && !hasInn) {
    throw new Error('Необходимо указать farmer_id или farmer_inn');
  }
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const params = new URLSearchParams();
  if (hasId) params.append('farmer_id', String(Number(farmer_id)));
  if (hasInn) params.append('farmer_inn', String(Number(farmer_inn)));
  const url = `${API_BASE_URL2}api/mymap/plantations/?${params.toString()}`;
  try {
    const data = await dedupeFetchJson(url, { headers });
    const results = Array.isArray(data?.results) ? data.results : [];
    return results.map(p => {
      
      const result = {
        id: p.id,
        name: p.name, // Это имя фермера согласно API документации
        farmer_name: p.farmer_name || p.name, // Используем farmer_name из API, если есть, иначе name
        is_checked: !!p.is_checked,
        is_rejected: !!p.is_rejected,
        coordinates: Array.isArray(p.coordinates) ? p.coordinates : [],
        fertility_score: Number(p.fertility_score ?? 0),
        total_area: Number(p.total_area ?? 0),
        images: Array.isArray(p.images) ? p.images : undefined,
      };
      
      
      return result;
    });
  } catch (error) {
    // Специфичная обработка ошибок согласно API документации
    const status = error?.response?.status;
    const errorMessage = error?.response?.data?.error || error?.message || '';
    
    if (status === 400) {
      if (errorMessage.includes('farmer_inn') || errorMessage.includes('farmer_id')) {
        throw new Error('Необходимо указать farmer_inn или farmer_id');
      }
      throw new Error('Неверные параметры запроса');
    }
    if (status === 403) {
      throw new Error('Недостаточно прав для доступа к этой информации');
    }
    if (status === 500) {
      throw new Error('Произошла ошибка при получении данных');
    }
    
    console.error('Ошибка при загрузке плантаций фермера:', error);
    throw error;
  }
}

export async function fetchFarmersStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    // Новые параметры поиска и фильтрации
    if (params.search) queryParams.append('search', params.search);
    if (params.region) queryParams.append('region', params.region);
    if (params.district) queryParams.append('district', params.district);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/farmers/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/farmers/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики фермеров:", error);
    throw error;
  }
}

// Отправка запроса на удаление плантации
export async function sendPlantationDeleteRequest(plantationId, comment, accessToken) {
  try {
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
    
    const body = {
      moderation_comment: [
        {
          text: comment,
          image: null
        }
      ]
    };
    
    const response = await fetch(
      `${API_BASE_URL2}api/plantations/${plantationId}/delete/`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Ошибка при отправке запроса на удаление:", error);
    throw error;
  }
}

export async function fetchUsersStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.user_id) queryParams.append('user_id', params.user_id);
    if (params.days) queryParams.append('days', params.days);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/users/forme/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/users/forme/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики пользователей:", error);
    throw error;
  }
}

// RBAC: выбор эндпоинта статистики пользователей по роли
export function getUsersStatisticsUrlByRole(role) {
  if (role === "superuser") {
    return `${API_BASE_URL2}api/statistics/users/detailed/`;
  } else if (role === "headof_region") {
    // Основной эндпоинт для главы региона — forme
    return `${API_BASE_URL2}api/statistics/users/forme/`;
  } else if (role === "observer") {
    // Наблюдатель: только просмотр полной статистики пользователей
    return `${API_BASE_URL2}api/statistics/users/detailed/`;
  }
  // Обычные пользователи не имеют доступа к системе
  return null;
}

export async function fetchUsersStatisticsByRole(role, params = {}, accessToken) {
  const url = getUsersStatisticsUrlByRole(role);
  if (!url) throw new Error("Sizda statistikaga ruxsat yo'q");
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    
    // Основные параметры фильтрации
    if (params.region) queryParams.append('region', params.region);
    if (params.district) queryParams.append('district', params.district);
    if (params.days) queryParams.append('days', params.days);
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);
    if (params.min_kpi) queryParams.append('min_kpi', params.min_kpi);
    if (params.max_kpi) queryParams.append('max_kpi', params.max_kpi);
    if (params.activity) queryParams.append('activity', params.activity);
    if (params.search) queryParams.append('search', params.search);
    
    // Параметры сортировки
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    
    const queryString = queryParams.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;
    try {
      return await dedupeFetchJson(finalUrl, { headers });
    } catch (e) {
      const msg = String(e?.message || '');
      const is403 = msg.includes('403');
      if (role === 'headof_region' && is403) {
        const fallbackUrl = queryString
          ? `${API_BASE_URL2}api/statistics/users/detailed/?${queryString}`
          : `${API_BASE_URL2}api/statistics/users/detailed/`;
        return await dedupeFetchJson(fallbackUrl, { headers });
      }
      throw e;
    }
  } catch (error) {
    console.error("RBAC: Ошибка при загрузке статистики пользователей:", error);
    throw error;
  }
}

export async function fetchRegionRejectedOverallStatistics(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/rejected/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/rejected/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики отклоненных плантаций:", error);
    throw error;
  }
}

// Новые API функции согласно документации v2.0
export async function fetchRegionsStatisticsWithStatus(status = 'all', params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL2}api/statistics/regions/?${queryString}`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики регионов с фильтром:", error);
    throw error;
  }
}

export async function fetchDistrictsStatisticsWithStatus(status = 'all', params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    queryParams.append('status', status);
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL2}api/statistics/districts/?${queryString}`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики районов с фильтром:", error);
    throw error;
  }
}

export async function fetchFarmersStatisticsWithFilters(params = {}, accessToken) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.region_id) queryParams.append('region_id', params.region_id);
    if (params.district_id) queryParams.append('district_id', params.district_id);
    if (params.est_date) queryParams.append('est_date', params.est_date);
    if (params.planted_year) queryParams.append('planted_year', params.planted_year);
    if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
    if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/farmers/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/farmers/`;
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    console.error("Ошибка при загрузке статистики фермеров с фильтрами:", error);
    throw error;
  }
}
