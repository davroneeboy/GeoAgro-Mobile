import { API_BASE_URL2 } from "../config";

let cachedPlantations = null;

export async function fetchPlantationsMap() {
    if (cachedPlantations) {
        return cachedPlantations;
    }

    const response = await fetch(`${API_BASE_URL2}api/plantations/map/?district_id=1&is_checked=True`);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    cachedPlantations = data.results;
    return cachedPlantations;
}