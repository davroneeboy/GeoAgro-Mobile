# 🚀 Рекомендации по улучшению проекта

Этот документ содержит рекомендации по улучшению кодовой базы на основе принципов SOLID, DRY, KISS и YAGNI.

---

## 📋 Содержание

1. [SOLID принципы](#solid-принципы)
2. [DRY (Don't Repeat Yourself)](#dry-dont-repeat-yourself)
3. [KISS (Keep It Simple, Stupid)](#kiss-keep-it-simple-stupid)
4. [YAGNI (You Aren't Gonna Need It)](#yagni-you-arent-gonna-need-it)
5. [Общие рекомендации](#общие-рекомендации)

---

## 🔷 SOLID принципы

### 1. Single Responsibility Principle (SRP)

**Текущее состояние:** ✅ Частично реализовано

**Проблемы:**
- `mapContainer.js` делает слишком много: управление картой, загрузка данных, фильтрация, UI рендеринг
- `api.js` содержит все API функции в одном файле

**Рекомендации:**

#### Разделить `mapContainer.js` на компоненты:

```
src/components/Map/
├── MapContainer.js      # Главный контейнер
├── MapFilters.js        # Компонент фильтров
├── PlantationList.js    # Список плантаций
├── PlantationDetail.js  # Детали плантации (уже есть, но можно улучшить)
└── MapControls.js       # Элементы управления картой
```

**Пример рефакторинга:**

```javascript
// src/components/Map/MapFilters.js
export default function MapFilters({ filters, onFilterChange }) {
  return (
    <div className="space-y-2 mb-4 p-2 bg-gray-700 rounded-lg">
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Status:
      </label>
      <select
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="w-full px-2 py-1 bg-gray-600 text-white rounded border border-gray-500 text-sm"
      >
        <option value="approved">Tasdiqlangan (Yashil)</option>
        <option value="pending">Moderatsiyada (Sariq)</option>
        <option value="rejected">Rad etilgan (Qizil)</option>
        <option value="deleting">O'chirilmoqda (To'q sariq)</option>
      </select>
      {/* ... остальные фильтры */}
    </div>
  );
}
```

#### Разделить `api.js` на модули:

```
src/api/
├── index.js              # Экспорт всех функций
├── plantations.js        # API для плантаций
├── statistics.js         # API для статистики
├── auth.js              # API для аутентификации
└── utils.js             # Утилиты (dedupeFetchJson, кэш)
```

**Пример структуры:**

```javascript
// src/api/plantations.js
import { API_BASE_URL2 } from "../config";
import { dedupeFetchJson, createAuthHeaders } from "./utils";

export async function fetchPlantationsMapAll(params = {}, accessToken) {
  const headers = createAuthHeaders(accessToken);
  // ... логика
}

export async function fetchPlantationDetails(id, accessToken) {
  const headers = createAuthHeaders(accessToken);
  // ... логика
}

// src/api/utils.js
export function createAuthHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function dedupeFetchJson(url, options = {}) {
  // ... существующая логика
}
```

### 2. Open/Closed Principle (OCP)

**Текущее состояние:** ✅ Хорошо реализовано

**Улучшения:**

- Создать систему плагинов для фильтров
- Использовать стратегию для разных типов загрузки данных

```javascript
// src/utils/filterStrategies.js
export const filterStrategies = {
  approved: (params) => ({ ...params, status: 'approved' }),
  rejected: (params) => ({ ...params, status: 'rejected' }),
  pending: (params) => ({ ...params, status: 'pending' }),
  deleting: (params) => ({ ...params, status: 'deleting' }),
};

export function applyFilterStrategy(status, params) {
  const strategy = filterStrategies[status] || filterStrategies.approved;
  return strategy(params);
}
```

### 3. Liskov Substitution Principle (LSP)

**Текущее состояние:** ✅ Хорошо реализовано

**Рекомендации:**

- Обеспечить единообразие интерфейсов API функций
- Использовать TypeScript для проверки типов (опционально)

### 4. Interface Segregation Principle (ISP)

**Текущее состояние:** ⚠️ Можно улучшить

**Проблемы:**
- Один большой файл `api.js` со всеми функциями
- Компоненты зависят от всего API, а не от нужных частей

**Рекомендации:**

```javascript
// Вместо импорта всего api.js:
import { fetchPlantationsMapAll, fetchRegionsStatistics, ... } from "../api/api.js";

// Импортировать только нужное:
import { fetchPlantationsMapAll } from "../api/plantations";
import { fetchRegionsStatistics } from "../api/statistics";
```

### 5. Dependency Inversion Principle (DIP)

**Текущее состояние:** ✅ Хорошо реализовано

**Улучшения:**

- Создать абстракции для API клиента
- Использовать dependency injection для тестирования

```javascript
// src/api/ApiClient.js
class ApiClient {
  constructor(baseURL, tokenProvider) {
    this.baseURL = baseURL;
    this.tokenProvider = tokenProvider;
  }

  async get(endpoint, params = {}) {
    const headers = this.createHeaders();
    // ... логика
  }
}

// Использование:
const apiClient = new ApiClient(API_BASE_URL2, () => authState.accessToken);
```

---

## 🔄 DRY (Don't Repeat Yourself)

### Проблемы:

1. **Дублирование создания headers:**
   ```javascript
   // Повторяется в api.js, mapContainer.js и других местах
   const headers = { 'Content-Type': 'application/json' };
   if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
   ```

2. **Дублирование логики обработки ошибок:**
   ```javascript
   // Повторяется в разных компонентах
   if (error.message && error.message.includes('404')) {
     alert('❌ Bu tumanga kirish huquqi yo\'q!');
   } else if (error.message && error.message.includes('403')) {
     alert('❌ Ruxsat yo\'q!');
   }
   ```

3. **Дублирование стилей фильтров:**
   - Фильтры повторяются в десктопной и мобильной версиях

### Решения:

#### 1. Создать утилиту для headers:

```javascript
// src/utils/apiHeaders.js
export function createAuthHeaders(accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}
```

#### 2. Создать утилиту для обработки ошибок:

```javascript
// src/utils/errorHandler.js
export function handleApiError(error, userRole = 'user') {
  const errorMessage = String(error?.message || '');
  
  if (errorMessage.includes('404')) {
    return {
      message: '❌ Bu tumanga kirish huquqi yo\'q!\n\nSiz faqat o\'z viloyatingizdagi tumanlarni ko\'rishingiz mumkin.',
      showAlert: userRole !== 'observer'
    };
  }
  
  if (errorMessage.includes('403')) {
    return {
      message: '❌ Ruxsat yo\'q!\n\nBu tumanni ko\'rish uchun ruxsatingiz yo\'q.',
      showAlert: true
    };
  }
  
  if (errorMessage.includes('400')) {
    return {
      message: '❌ Noto\'g\'ri filtrlarni tekshiring.',
      showAlert: true
    };
  }
  
  return {
    message: '❌ Xatolik!\n\nTuman bog\'larini yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.',
    showAlert: true
  };
}
```

#### 3. Создать переиспользуемый компонент фильтров:

```javascript
// src/components/Map/MapFilters.js
export default function MapFilters({ filters, onFilterChange, onClearFilters }) {
  return (
    <div className="space-y-2 mb-4 p-2 bg-gray-700 rounded-lg">
      {/* Фильтры */}
      <button onClick={onClearFilters}>
        Filtrlarni tozalash
      </button>
    </div>
  );
}

// Использование в mapContainer.js:
<MapFilters 
  filters={filters}
  onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
  onClearFilters={() => setFilters({ status: 'approved', name: '', inn: '' })}
/>
```

---

## 💡 KISS (Keep It Simple, Stupid)

### Проблемы:

1. **Сложная логика определения цвета:**
   ```javascript
   // Слишком сложная вложенная логика
   let color = "red";
   if (currentFilters.status === 'approved' || (plantation.is_checked && !plantation.is_rejected && !plantation.is_deleting)) {
     color = "green";
   } else if (currentFilters.status === 'rejected' || plantation.is_rejected) {
     color = "red";
   }
   ```

2. **Сложная логика debounce:**
   - Можно упростить использование

### Решения:

#### 1. Упростить логику цвета:

```javascript
// src/utils/plantationColors.js
export function getPlantationColor(status, plantation = null) {
  // Если выбран конкретный статус - используем его цвет
  const statusColors = {
    approved: 'green',
    rejected: 'red',
    pending: 'yellow',
    moderation: 'yellow',
    deleting: 'orange',
  };
  
  if (status && status !== 'all' && statusColors[status]) {
    return statusColors[status];
  }
  
  // Если "all" - определяем по полям плантации
  if (plantation) {
    if (plantation.is_checked && !plantation.is_rejected && !plantation.is_deleting) {
      return 'green';
    }
    if (plantation.is_rejected) {
      return 'red';
    }
    if (plantation.is_deleting) {
      return 'orange';
    }
    return 'yellow'; // На модерации
  }
  
  return 'yellow'; // По умолчанию
}
```

#### 2. Создать хук для debounce:

```javascript
// src/hooks/useDebounce.js
import { useEffect, useRef } from 'react';

export function useDebounce(callback, delay, dependencies) {
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
}

// Использование:
useDebounce(
  () => loadPlantationsRef.current(1, filters, selectedDistrict, selectedRegion),
  500,
  [filters.name, filters.inn]
);
```

---

## 🚫 YAGNI (You Aren't Gonna Need It)

### Проблемы:

1. **Неиспользуемые параметры в фильтрах:**
   ```javascript
   const [filters, setFilters] = useState({
     status: 'approved',
     region: '',           // Не используется
     district_id: null,    // Устанавливается автоматически
     plantation_type: '',  // Не используется
     name: '',
     inn: '',
   });
   ```

2. **Неиспользуемые импорты:**
   - `useCallback` был удален (хорошо)
   - Возможно есть другие

### Решения:

#### 1. Убрать неиспользуемые параметры:

```javascript
// Упрощенная версия:
const [filters, setFilters] = useState({
  status: 'approved',
  name: '',
  inn: '',
});
```

#### 2. Регулярно проверять неиспользуемый код:

```bash
# Использовать ESLint для поиска неиспользуемых переменных
npm run lint

# Или использовать инструменты типа:
# - unused-imports
# - ts-prune (для TypeScript)
```

---

## 📦 Общие рекомендации

### 1. Создать хуки для бизнес-логики

```
src/hooks/
├── usePlantations.js    # Логика загрузки плантаций
├── useMap.js            # Логика работы с картой
├── useFilters.js        # Логика фильтрации
└── useDebounce.js       # Хук для debounce
```

**Пример:**

```javascript
// src/hooks/usePlantations.js
import { useState, useCallback } from 'react';
import { fetchPlantationsMapAll } from '../api/plantations';
import { handleApiError } from '../utils/errorHandler';

export function usePlantations(accessToken, userRole) {
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });

  const loadPlantations = useCallback(async (page, filters, district, region) => {
    if (!district) {
      setPlantations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        page_size: 100,
        returnFullResponse: true,
        district_id: district.id,
        ...filters,
      };

      const response = await fetchPlantationsMapAll(params, accessToken);
      setPlantations(response.results || []);
      setPagination({
        count: response.count || 0,
        next: response.next,
        previous: response.previous,
        currentPage: page,
      });
    } catch (err) {
      const errorInfo = handleApiError(err, userRole);
      setError(errorInfo);
      if (errorInfo.showAlert) {
        alert(errorInfo.message);
      }
      setPlantations([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, userRole]);

  return {
    plantations,
    loading,
    error,
    pagination,
    loadPlantations,
  };
}
```

### 2. Создать константы для магических значений

```javascript
// src/constants/map.js
export const MAP_CONFIG = {
  DEFAULT_CENTER: [41.2995, 69.2401],
  DEFAULT_ZOOM: 6,
  PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 500,
};

export const PLANTATION_COLORS = {
  approved: 'green',
  rejected: 'red',
  pending: 'yellow',
  moderation: 'yellow',
  deleting: 'orange',
  default: 'yellow',
};
```

### 3. Улучшить структуру проекта

```
src/
├── api/
│   ├── index.js
│   ├── plantations.js
│   ├── statistics.js
│   ├── auth.js
│   └── utils.js
├── components/
│   ├── Map/
│   │   ├── MapContainer.js
│   │   ├── MapFilters.js
│   │   ├── PlantationList.js
│   │   └── MapControls.js
│   └── ProtectedRoute.js
├── hooks/
│   ├── usePlantations.js
│   ├── useMap.js
│   ├── useFilters.js
│   └── useDebounce.js
├── utils/
│   ├── apiHeaders.js
│   ├── errorHandler.js
│   ├── plantationColors.js
│   └── moderationUtils.js
├── constants/
│   ├── map.js
│   └── roles.js
└── pages/
    └── ...
```

### 4. Добавить TypeScript (опционально)

TypeScript поможет:
- Обнаруживать ошибки на этапе разработки
- Улучшить автодополнение
- Сделать код более самодокументируемым

### 5. Добавить тесты

```javascript
// src/utils/__tests__/errorHandler.test.js
import { handleApiError } from '../errorHandler';

describe('handleApiError', () => {
  it('should handle 404 error', () => {
    const error = { message: 'HTTP error! Status: 404' };
    const result = handleApiError(error);
    expect(result.message).toContain('kirish huquqi yo\'q');
  });
});
```

---

## 📊 Приоритеты улучшений

### Высокий приоритет:
1. ✅ Разделить `api.js` на модули
2. ✅ Создать утилиту для headers (`createAuthHeaders`)
3. ✅ Создать утилиту для обработки ошибок
4. ✅ Упростить логику определения цвета плантаций

### Средний приоритет:
1. Разделить `mapContainer.js` на компоненты
2. Создать хуки для бизнес-логики
3. Убрать неиспользуемые параметры (YAGNI)

### Низкий приоритет:
1. Добавить TypeScript
2. Добавить тесты
3. Создать систему плагинов для фильтров

---

## 🎯 Чек-лист для рефакторинга

- [ ] Разделить `api.js` на модули
- [ ] Создать `createAuthHeaders` утилиту
- [ ] Создать `handleApiError` утилиту
- [ ] Создать `getPlantationColor` функцию
- [ ] Разделить `mapContainer.js` на компоненты
- [ ] Создать хук `usePlantations`
- [ ] Создать хук `useDebounce`
- [ ] Убрать неиспользуемые параметры из фильтров
- [ ] Создать переиспользуемый компонент `MapFilters`
- [ ] Добавить константы для магических значений
- [ ] Улучшить структуру проекта

---

## 📝 Примечания

- Все улучшения должны быть внедрены постепенно
- Перед рефакторингом убедиться, что есть тесты (или создать их)
- Документировать изменения в коде
- Проверять работоспособность после каждого изменения

---

**Дата создания:** 2024  
**Последнее обновление:** 2024

