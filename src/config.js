export const API_BASE_URL1 = "https://luxa.uz/";
export const API_BASE_URL2 = "https://luxa.uz/";
// export const API_BASE_URL2 = "https://uzagrosanoat.uz/";
export const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";

// Отладка для продакшена (можно удалить после проверки)
if (process.env.NODE_ENV === 'production' && !GOOGLE_API_KEY) {
  console.error('⚠️ REACT_APP_GOOGLE_MAPS_API_KEY не загружен в продакшене! Проверьте настройки в Netlify.');
}
