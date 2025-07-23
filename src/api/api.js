import { API_BASE_URL2 } from "../config";

let cachedPlantations = null;

export function clearPlantationsCache() {
    cachedPlantations = null;
}

export async function fetchPlantationsMap() {
    if (cachedPlantations) {
        return cachedPlantations;
    }

    try {
        const response = await fetch(`${API_BASE_URL2}api/plantations/map/?district_id=1&is_checked=True`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        // Проверяем структуру ответа
        if (!data || !data.results) {
            console.warn('API вернул неожиданную структуру данных:', data);
            return [];
        }
        
        cachedPlantations = data.results;
        return cachedPlantations;
    } catch (error) {
        console.error('Ошибка при загрузке данных плантаций для карты:', error);
        return [];
    }
}