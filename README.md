# Agrosanoat Statistics System

Система статистики для Агросанёат агентства с поддержкой RBAC и расширенной аналитики.

## ✅ Реализованные изменения

### 1. Обновленная страница контроллеров (`/statistics/controllers`)

#### Новая структура данных API

- Обновлена таблица под структуру API запроса: `GET https://luxa.uz/api/statistics/users/detailed/`
- Добавлены новые поля:
  - `location.region` - регион пользователя
  - `location.district` - район пользователя
  - `last_login` - дата последнего входа
  - `plantations_stats.rejection_rate` - процент отклонения плантаций
  - `kpi_current.points` и `kpi_current.amount` - KPI показатели

#### Фильтр времени

- Добавлен dropdown фильтр времени с опциями:
  - "So'nggi 7 kun" (последние 7 дней)
  - "So'nggi 30 kun" (последние 30 дней)
  - "So'nggi 90 kun" (последние 90 дней)
  - "So'nggi yil" (последний год)
  - "Maxsus davr" (кастомный период с выбором дат)
- Реализованы API запросы с параметрами: `?days=7`, `?days=30`, `?days=90`, `?days=365`
- Поддержка кастомных дат: `?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

#### Улучшенный UI

- Добавлены карточки статистики:
  - Общее количество контроллеров
  - Общее количество плантаций
  - Количество одобренных плантаций
  - KPI сумма
- Улучшенная таблица с группировкой колонок:
  - Основная информация (F.I.Sh, Login, Телефон, Region, Tuman, Oxirgi kirish)
  - Plantatsiyalar (Umumiy, Tasdiqlangan, Rad etilgan, Rad etish %)
  - KPI (Ballar, Summa)
- Поддержка сортировки по всем колонкам
- Пагинация с настройкой размера страницы
- Итоговая строка с суммами

### 2. RBAC система (базовая структура)

#### Роли пользователей

- **admin** - полный доступ ко всем функциям
- **moderator** - доступ к модерации и статистике
- **headofregion** - доступ только к статистике своего региона

#### Права доступа

```javascript
ROLE_PERMISSIONS = {
  admin: {
    canViewAllRegions: true,
    canViewAllControllers: true,
    canModerate: true,
    canManageUsers: true,
    canViewStatistics: true,
    canExportData: true,
  },
  moderator: {
    canViewAllRegions: true,
    canViewAllControllers: true,
    canModerate: true,
    canManageUsers: false,
    canViewStatistics: true,
    canExportData: true,
  },
  headofregion: {
    canViewAllRegions: false,
    canViewAllControllers: false,
    canModerate: false,
    canManageUsers: false,
    canViewStatistics: true,
    canExportData: false,
  },
};
```

#### Защищенные маршруты

- `/statistics/controllers` - доступно всем ролям
- `/statistics/regions` - только admin и moderator
- `/statistics/fruits` - только admin и moderator
- `/moderation` - только admin и moderator
- `/farmers` - только admin и moderator

#### Автоматическая фильтрация по региону

- Если пользователь имеет роль `headofregion`, автоматически добавляется фильтр по его региону
- API запрос: `?region={user_region_id}`
- В заголовке страницы отображается "(Sizning viloyatingiz)"

#### Обновленный AuthContext

- Добавлено поле `userInfo` с информацией о пользователе
- Функции для проверки прав: `hasPermission()`, `hasRole()`, `getUserRegion()`
- Автоматическое сохранение информации о пользователе при логине

#### ProtectedRoute

- Поддержка проверки ролей и прав доступа
- Автоматическое перенаправление при отсутствии прав
- Поддержка дополнительных требований к маршрутам

#### StatisticsLayout

- Динамическое меню в зависимости от роли пользователя
- Скрытие недоступных разделов для headofregion
- Адаптивный дизайн для мобильных устройств

### 3. API Endpoints

- `GET /api/statistics/users/detailed/` - основная статистика контроллеров
- Поддержка параметров времени: `days`, `start_date`, `end_date`
- Поддержка фильтра по региону: `region`

### 4. Структура данных пользователя

```javascript
{
  id: 434,
  username: "rishton_user",
  first_name: "",
  last_name: "",
  phone_number: "+998999999999",
  contact_link: null,
  location: {
    region: 4,
    district: "Rishton",
    district_id: 56
  },
  last_login: null,
  kpi_current: {
    points: 0,
    amount: 0
  },
  plantations_stats: {
    total: 0,
    approved: 0,
    rejected: 0,
    rejection_rate: 0,
    last_plantation_date: null
  }
}
```

### 5. Вход в систему

- Username: `rokki`
- Password: `Poklmnji8`

## 🚀 Запуск проекта

1. Установите зависимости:

```bash
npm install
```

2. Запустите сервер разработки:

```bash
npm start
```

3. Откройте http://localhost:3000 в браузере

## 📁 Структура файлов

```
src/
├── pages/statistics/
│   └── ControllersPage.js          # Обновленная страница контроллеров
├── context/
│   ├── AuthContext.js              # Контекст аутентификации с RBAC
│   └── constants.js                # Константы ролей и прав
├── components/
│   └── ProtectedRoute.js           # Компонент защиты маршрутов
├── layouts/
│   └── StatisticsLayout.js         # Макет статистики с динамическим меню
└── router.js                       # Роутер с проверкой прав доступа
```

## 🔧 Технические детали

### Используемые технологии

- React 18
- Ant Design (UI компоненты)
- React Router (навигация)
- Axios (HTTP запросы)
- Tailwind CSS (стили)

### Основные функции

- Фильтрация по времени (7, 30, 90, 365 дней)
- Кастомные даты
- Сортировка по всем колонкам
- Пагинация
- Экспорт данных
- Адаптивный дизайн

## 📋 Планы на будущее

1. Экспорт в Excel
2. Дополнительные фильтры (по региону, статусу)
3. Графики и диаграммы
4. Уведомления о новых плантациях
5. Мобильная версия интерфейса

## 🐛 Известные проблемы

- RBAC система временно упрощена для стабильности
- Некоторые фильтры могут требовать дополнительной настройки
- Мобильная версия требует доработки

## 📞 Поддержка

При возникновении проблем обращайтесь к команде разработки.
