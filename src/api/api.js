import { API_BASE_URL2 } from "../config";
import { ApiError, ApiErrorCode } from "../types/apiErrors";

// Кэш по districtId, чтобы не смешивать результаты разных туманов
const plantationsCacheByDistrict = new Map();

// Дедупликация параллельных GET-запросов (in-flight cache)
const inFlightRequests = new Map();

/**
 * Создать ApiError из Response объекта
 */
const createApiErrorFromResponse = async (response) => {
  let errorData = null;
  try {
    errorData = await response.json();
  } catch {
    // Тело не JSON
  }

  const message = 
    errorData?.detail || 
    errorData?.message || 
    errorData?.error ||
    `HTTP ${response.status}: ${response.statusText}`;

  return ApiError.fromHttpStatus(response.status, message, {
    status: response.status,
    statusText: response.statusText,
    data: errorData,
  });
};

/**
 * Дедупликация GET-запросов с автоматическим парсингом JSON
 */
const dedupeFetchJson = async (url, options = {}) => {
  const key = `${url}|${JSON.stringify(options)}`;
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }
  const promise = (async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw await createApiErrorFromResponse(response);
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
    throw new ApiError('API_BASE_URL2 is not defined', ApiErrorCode.BAD_REQUEST, 0);
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
    const apiError = ApiError.from(error);
    console.error("Ошибка при загрузке данных плантаций для карты:", apiError.toJSON());

    // Фолбэк для observer: пробуем общий список плантаций
    const isAccessError = apiError.code === ApiErrorCode.FORBIDDEN || apiError.code === ApiErrorCode.NOT_FOUND;
    if (userRole === 'observer' && isAccessError) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

        let data = await dedupeFetchJson(
          `${API_BASE_URL2}api/plantations/?district_id=${key}&page_size=1000`,
          { headers }
        );
        if (!data || !data.results || data.results.length === 0) {
          data = await dedupeFetchJson(
            `${API_BASE_URL2}api/plantations/?page_size=1000`,
            { headers }
          );
        }
        const results = Array.isArray(data?.results) ? data.results : [];
        plantationsCacheByDistrict.set(key, results);
        return results;
      } catch (fallbackError) {
        const fallbackApiError = ApiError.from(fallbackError);
        console.error('Fallback plantations fetch failed:', fallbackApiError.toJSON());
        return [];
      }
    }
    return [];
  }
}

/**
 * Получение всех плантаций с расширенной фильтрацией
 */
export async function fetchPlantationsMapAll(params = {}, accessToken) {
  if (!API_BASE_URL2) {
    throw new ApiError('API_BASE_URL2 is not defined', ApiErrorCode.BAD_REQUEST, 0);
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const queryParams = new URLSearchParams();
    
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
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
    
    if (params.page) {
      queryParams.append('page', String(params.page));
    }
    
    if (params.page_size) {
      queryParams.append('page_size', String(params.page_size));
    } else {
      queryParams.append('page_size', '100');
    }

    const queryString = queryParams.toString();
    const url = queryString
      ? `${API_BASE_URL2}api/plantations/map/all/?${queryString}`
      : `${API_BASE_URL2}api/plantations/map/all/`;

    const data = await dedupeFetchJson(url, { headers });

    if (params.returnFullResponse) {
      return {
        count: data.count || 0,
        next: data.next || null,
        previous: data.previous || null,
        results: Array.isArray(data.results) ? data.results : [],
        stats: data.stats || null,
      };
    }

    return Array.isArray(data?.results) ? data.results : [];
  } catch (error) {
    const apiError = ApiError.from(error);
    console.error("Ошибка при загрузке данных плантаций:", apiError.toJSON());
    throw apiError;
  }
}

// =============================================
// Статистические API функции
// =============================================

/**
 * Построить заголовки с авторизацией
 */
const buildAuthHeaders = (accessToken) => {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

/**
 * Обёртка для статистических запросов
 */
const fetchWithErrorHandling = async (url, headers, context) => {
  try {
    return await dedupeFetchJson(url, { headers });
  } catch (error) {
    const apiError = ApiError.from(error);
    console.error(`Ошибка при загрузке ${context}:`, apiError.toJSON());
    throw apiError;
  }
};

export async function fetchRegionsStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.est_date) queryParams.append('est_date', params.est_date);
  if (params.planted_year) queryParams.append('planted_year', params.planted_year);
  if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
  if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
  if (params.status) queryParams.append('status', params.status);
  if (params.region_id) queryParams.append('region_id', params.region_id);
  if (params.district_id) queryParams.append('district_id', params.district_id);
  
  const queryString = queryParams.toString();
  const url = queryString ? 
    `${API_BASE_URL2}api/statistics/regions/?${queryString}` : 
    `${API_BASE_URL2}api/statistics/regions/`;
    
  return await fetchWithErrorHandling(url, headers, 'статистики регионов');
}

export async function fetchRegionDistrictsStatistics(regionId, params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики районов региона');
}

export async function fetchRegionApprovedStatistics(regionId, params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики одобренных плантаций');
}

export async function fetchRegionRejectedStatistics(regionId, params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики отклоненных плантаций');
}

export async function fetchStatisticsSummary(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = queryString ? 
    `${API_BASE_URL2}api/statistics/summary/?${queryString}` : 
    `${API_BASE_URL2}api/statistics/summary/`;
    
  return await fetchWithErrorHandling(url, headers, 'сводной статистики');
}

export async function fetchDistrictsStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = queryString ? 
    `${API_BASE_URL2}api/statistics/districts/?${queryString}` : 
    `${API_BASE_URL2}api/statistics/districts/`;
    
  return await fetchWithErrorHandling(url, headers, 'статистики районов');
}

export async function fetchDistrictDetail(districtId, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const url = `${API_BASE_URL2}api/statistics/districts/${districtId}/`;
  return await fetchWithErrorHandling(url, headers, 'детальной статистики района');
}

export async function fetchRegionFruitsStatistics(regionId, params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики фруктов региона');
}

export async function fetchFruitsStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики фруктов');
}

/**
 * Получение плантаций конкретного фермера для карты
 */
export async function fetchFarmerPlantations({ farmer_id, farmer_inn }, accessToken) {
  const hasId = Number.isFinite(Number(farmer_id));
  const hasInn = (
    farmer_inn !== undefined && farmer_inn !== null && String(farmer_inn).trim() !== '' &&
    Number.isFinite(Number(farmer_inn)) && Number(farmer_inn) > 0
  );
  
  if (!hasId && !hasInn) {
    throw new ApiError(
      'farmer_id yoki farmer_inn ko\'rsatilishi kerak',
      ApiErrorCode.VALIDATION_ERROR,
      400
    );
  }
  
  const headers = buildAuthHeaders(accessToken);
  const params = new URLSearchParams();
  if (hasId) params.append('farmer_id', String(Number(farmer_id)));
  if (hasInn) params.append('farmer_inn', String(Number(farmer_inn)));
  
  const url = `${API_BASE_URL2}api/mymap/plantations/?${params.toString()}`;
  
  try {
    const data = await dedupeFetchJson(url, { headers });
    const results = Array.isArray(data?.results) ? data.results : [];
    
    return results.map(p => ({
      id: p.id,
      name: p.name,
      farmer_name: p.farmer_name || p.name,
      is_checked: !!p.is_checked,
      is_rejected: !!p.is_rejected,
      coordinates: Array.isArray(p.coordinates) ? p.coordinates : [],
      fertility_score: Number(p.fertility_score ?? 0),
      total_area: Number(p.total_area ?? 0),
      images: Array.isArray(p.images) ? p.images : undefined,
    }));
  } catch (error) {
    const apiError = ApiError.from(error);
    console.error('Ошибка при загрузке плантаций фермера:', apiError.toJSON());
    throw apiError;
  }
}

export async function fetchFarmersStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.est_date) queryParams.append('est_date', params.est_date);
  if (params.planted_year) queryParams.append('planted_year', params.planted_year);
  if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
  if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
  if (params.search) queryParams.append('search', params.search);
  if (params.region) queryParams.append('region', params.region);
  if (params.district) queryParams.append('district', params.district);
  
  const queryString = queryParams.toString();
  const url = queryString ? 
    `${API_BASE_URL2}api/statistics/farmers/?${queryString}` : 
    `${API_BASE_URL2}api/statistics/farmers/`;
    
  return await fetchWithErrorHandling(url, headers, 'статистики фермеров');
}

/**
 * Отправка запроса на удаление плантации
 */
export async function sendPlantationDeleteRequest(plantationId, comment, accessToken) {
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
  
  try {
    const response = await fetch(
      `${API_BASE_URL2}api/plantations/${plantationId}/delete/`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
      }
    );
    
    if (!response.ok) {
      throw await createApiErrorFromResponse(response);
    }
    
    return await response.json();
  } catch (error) {
    const apiError = ApiError.from(error);
    console.error("Ошибка при отправке запроса на удаление:", apiError.toJSON());
    throw apiError;
  }
}

export async function fetchUsersStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.user_id) queryParams.append('user_id', params.user_id);
  if (params.days) queryParams.append('days', params.days);
  
  const queryString = queryParams.toString();
  const url = queryString ? 
    `${API_BASE_URL2}api/statistics/users/forme/?${queryString}` : 
    `${API_BASE_URL2}api/statistics/users/forme/`;
    
  return await fetchWithErrorHandling(url, headers, 'статистики пользователей');
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
  if (!url) {
    throw new ApiError(
      "Sizda statistikaga ruxsat yo'q",
      ApiErrorCode.FORBIDDEN,
      403
    );
  }
  
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  if (params.region) queryParams.append('region', params.region);
  if (params.district) queryParams.append('district', params.district);
  if (params.days) queryParams.append('days', params.days);
  if (params.date_from) queryParams.append('date_from', params.date_from);
  if (params.date_to) queryParams.append('date_to', params.date_to);
  if (params.min_kpi) queryParams.append('min_kpi', params.min_kpi);
  if (params.max_kpi) queryParams.append('max_kpi', params.max_kpi);
  if (params.activity) queryParams.append('activity', params.activity);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
  
  const queryString = queryParams.toString();
  const finalUrl = queryString ? `${url}?${queryString}` : url;
  
  try {
    return await dedupeFetchJson(finalUrl, { headers });
  } catch (error) {
    const apiError = ApiError.from(error);
    
    // Фолбэк для headof_region при 403
    if (role === 'headof_region' && apiError.code === ApiErrorCode.FORBIDDEN) {
      const fallbackUrl = queryString
        ? `${API_BASE_URL2}api/statistics/users/detailed/?${queryString}`
        : `${API_BASE_URL2}api/statistics/users/detailed/`;
      return await fetchWithErrorHandling(fallbackUrl, headers, 'статистики пользователей (fallback)');
    }
    
    console.error("RBAC: Ошибка при загрузке статистики пользователей:", apiError.toJSON());
    throw apiError;
  }
}

export async function fetchRegionRejectedOverallStatistics(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики отклоненных плантаций');
}

// =============================================
// API функции v2.0 со статусом
// =============================================

export async function fetchRegionsStatisticsWithStatus(status = 'all', params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  queryParams.append('status', status);
  if (params.est_date) queryParams.append('est_date', params.est_date);
  if (params.planted_year) queryParams.append('planted_year', params.planted_year);
  if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
  if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
  
  const url = `${API_BASE_URL2}api/statistics/regions/?${queryParams.toString()}`;
  return await fetchWithErrorHandling(url, headers, 'статистики регионов с фильтром');
}

export async function fetchDistrictsStatisticsWithStatus(status = 'all', params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
  const queryParams = new URLSearchParams();
  
  queryParams.append('status', status);
  if (params.est_date) queryParams.append('est_date', params.est_date);
  if (params.planted_year) queryParams.append('planted_year', params.planted_year);
  if (params.min_fertility) queryParams.append('min_fertility', params.min_fertility);
  if (params.max_fertility) queryParams.append('max_fertility', params.max_fertility);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.sort_direction) queryParams.append('sort_direction', params.sort_direction);
  
  const url = `${API_BASE_URL2}api/statistics/districts/?${queryParams.toString()}`;
  return await fetchWithErrorHandling(url, headers, 'статистики районов с фильтром');
}

export async function fetchFarmersStatisticsWithFilters(params = {}, accessToken) {
  const headers = buildAuthHeaders(accessToken);
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
    
  return await fetchWithErrorHandling(url, headers, 'статистики фермеров с фильтрами');
}

// Реэкспорт для использования в других модулях
export { ApiError, ApiErrorCode };
