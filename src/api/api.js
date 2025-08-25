import { API_BASE_URL2 } from "../config";

// Кэш по districtId, чтобы не смешивать результаты разных туманов
const plantationsCacheByDistrict = new Map();

export function clearPlantationsCache(districtId) {
  if (typeof districtId === "number" || typeof districtId === "string") {
    plantationsCacheByDistrict.delete(Number(districtId));
  } else {
    plantationsCacheByDistrict.clear();
  }
}

export async function fetchPlantationsMap(districtId, accessToken) {
  const key = Number(districtId);
  if (!Number.isFinite(key)) {
    console.warn(
      "fetchPlantationsMap called without a valid districtId",
      districtId
    );
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

    const response = await fetch(
      `${API_BASE_URL2}api/plantations/map/?district_id=${key}`,
      { headers }
    );  
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();

    // Проверяем структуру ответа
    if (!data || !data.results) {
      console.warn("API вернул неожиданную структуру данных:", data);
      return [];
    }

    plantationsCacheByDistrict.set(key, data.results);
    return data.results;
  } catch (error) {
    console.error("Ошибка при загрузке данных плантаций для карты:", error);
    return [];
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
    
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/all/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/all/`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
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
    
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/districts/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/districts/`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
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
    
      // Если regionId равен null, используем общий эндпоинт для всех регионов
  let url;
  if (regionId === null) {
    const finalQueryString = queryParams.toString();
    url = finalQueryString ? 
      `${API_BASE_URL2}api/statistics/approved/?${finalQueryString}` : 
      `${API_BASE_URL2}api/statistics/approved/`;
  } else {
    url = queryString ? 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/approved/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/regions/${regionId}/approved/`;
  }
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
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
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке статистики отклоненных плантаций региона:", error);
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
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
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
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке статистики фруктов:", error);
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
    
    const queryString = queryParams.toString();
    const url = queryString ? 
      `${API_BASE_URL2}api/statistics/farmers/?${queryString}` : 
      `${API_BASE_URL2}api/statistics/farmers/`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке статистики фермеров:", error);
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
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке статистики пользователей:", error);
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

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Ошибка при загрузке статистики отклоненных плантаций:", error);
    throw error;
  }
}
