import heic2any from 'heic2any';

/**
 * Проверяет, является ли URL изображением формата HEIC
 * @param {string} url - URL изображения
 * @returns {boolean}
 */
export const isHeicImage = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.heic') || lowerUrl.endsWith('.heif');
};

/**
 * Конвертирует HEIC изображение в поддерживаемый формат (JPEG/PNG)
 * @param {string} heicUrl - URL HEIC изображения
 * @param {string} accessToken - Опциональный токен авторизации
 * @returns {Promise<string>} - Promise с URL конвертированного изображения (blob URL)
 */
export const convertHeicToJpeg = async (heicUrl, accessToken = null) => {
  try {
    // Подготавливаем заголовки для запроса
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    // Загружаем HEIC файл
    // Используем mode: 'cors' для обработки CORS проблем
    const response = await fetch(heicUrl, {
      mode: 'cors',
      credentials: 'omit',
      headers: headers
    });
    
    if (!response.ok) {
      console.error('Ошибка загрузки HEIC файла:', response.status, response.statusText, heicUrl);
      throw new Error(`Failed to fetch HEIC image: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    if (!blob || blob.size === 0) {
      throw new Error('Загруженный файл пуст');
    }
    
    // Проверяем, что библиотека heic2any доступна
    if (typeof heic2any === 'undefined' || !heic2any) {
      throw new Error('Библиотека heic2any не загружена');
    }
    
    // Конвертируем HEIC в JPEG
    const convertedBlob = await heic2any({
      blob: blob,
      toType: 'image/jpeg',
      quality: 0.8
    });
    
    // heic2any может вернуть массив, берем первый элемент
    const resultBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    if (!resultBlob) {
      throw new Error('Результат конвертации пуст');
    }
    
    // Создаем blob URL для отображения
    const blobUrl = URL.createObjectURL(resultBlob);
    return blobUrl;
  } catch (error) {
    console.error('Ошибка конвертации HEIC изображения:', error.message, heicUrl);
    // Возвращаем null в случае ошибки, чтобы компонент мог обработать это
    return null;
  }
};

/**
 * Получает URL изображения с поддержкой HEIC
 * Если изображение в формате HEIC, конвертирует его
 * @param {string} imageUrl - URL изображения
 * @returns {Promise<string | null>} - Promise с URL изображения (оригинальный или конвертированный)
 */
export const getImageUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  
  if (isHeicImage(imageUrl)) {
    return await convertHeicToJpeg(imageUrl);
  }
  
  return imageUrl;
};

