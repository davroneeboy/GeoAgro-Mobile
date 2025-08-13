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

export async function fetchPlantationsMap(districtId) {
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
    const response = await fetch(
      `${API_BASE_URL2}api/plantations/map/?district_id=${key}&is_checked=True`
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
