import React, { createContext, useState, useEffect } from "react";
import { API_BASE_URL2 } from '../config';
// import { USER_ROLES, ROLE_PERMISSIONS } from "./constants"; // Не используется в текущей реализации
import {
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
  getUserRole,
  setUserRole,
  getRegionId,
  setRegionId,
  getUserInfo,
  setUserInfo,
  removeUserData
} from '../utils/apiUtils';

const AuthContext = createContext();

// Нормализация роли: принимает строку/число, возвращает строковый идентификатор роли
function normalizeUserRole(rawRole) {
  if (rawRole === undefined || rawRole === null) return null;
  // Если пришло число или строка-число — маппим
  const n = Number(rawRole);
  if (Number.isFinite(n) && String(rawRole).trim() !== '' && !isNaN(n)) {
    if (n === 1) return 'superuser';
    if (n === 2) return 'headof_region';
    if (n === 3) return 'observer';
    return 'user'; // 0 и всё остальное — обычный пользователь
  }
  // Иначе это уже строковая роль
  const s = String(rawRole).toLowerCase();
  if (s === 'superuser' || s === 'headof_region' || s === 'observer' || s === 'user') return s;
  return 'user';
}

// Ключ для подсчёта активных вкладок
const TABS_KEY = 'activeTabCount';

function getActiveTabCount() {
  const raw = localStorage.getItem(TABS_KEY);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function setActiveTabCount(n) {
  const safe = Math.max(0, Number(n) || 0);
  if (safe === 0) localStorage.removeItem(TABS_KEY);
  else localStorage.setItem(TABS_KEY, String(safe));
}

// Функция для показа уведомления о входе
function showLoginNotification(userRole, userInfo) {
  const roleNames = {
    'superuser': 'Суперфойдаланувчи (Администратор)',
    'headof_region': 'Вилоят раҳбари',
    'user': 'Оддий фойдаланувчи',
    'observer': 'Кузатувчи'
  };

  const roleColors = {
    'superuser': 'bg-red-600',
    'headof_region': 'bg-blue-600', 
    'user': 'bg-green-600',
    'observer': 'bg-purple-600'
  };

  const roleName = roleNames[userRole] || 'Номаълум рол';
  const roleColor = roleColors[userRole] || 'bg-gray-600';
  const userName = userInfo?.first_name && userInfo?.last_name 
    ? `${userInfo.first_name} ${userInfo.last_name}`
    : userInfo?.username || 'Фойдаланувчи';

  // Создаем элемент уведомления
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 z-50 max-w-sm w-full ${roleColor} text-white p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`;
  notification.style.transform = 'translateX(100%)';
  
  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <h3 class="text-sm font-medium">Хуш келибсиз!</h3>
        <div class="mt-1 text-sm">
          <p><strong>${userName}</strong></p>
          <p>Рол: <strong>${roleName}</strong></p>
        </div>
      </div>
      <button class="ml-4 flex-shrink-0 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  // Добавляем в DOM
  document.body.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);

  // Автоматическое скрытие через 5 секунд
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 5000);
}

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    userRole: normalizeUserRole(getUserRole()),
    regionId: getRegionId(),
    userInfo: getUserInfo(),
  });

  const login = (data) => {
    setAuthTokens({ accessToken: data.access, refreshToken: data.refresh });
    // Проверяем роли в user_info, если они не в корне
    const userInfo = data.user_info || data;
    console.log('AuthContext - login data:', data);
    console.log('AuthContext - userInfo:', userInfo);

    // Новый маппинг по числовому полю user_role, если оно есть
    let userRole;
    if (userInfo && userInfo.user_role !== undefined && userInfo.user_role !== null) {
      const numericRole = Number(userInfo.user_role);
      if (numericRole === 1) userRole = 'superuser';
      else if (numericRole === 2) userRole = 'headof_region';
      else if (numericRole === 3) userRole = 'observer';
      else userRole = 'user'; // 0 и всё остальное — обычный пользователь
    } else {
      // Backward-compatible: старые флаги
      const isSuper = !!userInfo?.is_superuser;
      const isHead = !!userInfo?.is_headof_region;
      userRole = isSuper ? 'superuser' : (isHead ? 'headof_region' : 'user');
    }

    userRole = normalizeUserRole(userRole);

    console.log('AuthContext - determined userRole:', userRole);
    setUserRole(userRole);
    setRegionId(data.region_id);
    setUserInfo(data.user_info || data);
    setAuthState({
      accessToken: data.access,
      refreshToken: data.refresh,
      userRole: userRole,
      regionId: getRegionId(),
      userInfo: getUserInfo(),
    });

    // Показываем уведомление о входе
    showLoginNotification(userRole, userInfo);
  };

  const logout = () => {
    removeUserData();
    setAuthState({
      accessToken: null,
      refreshToken: null,
      userRole: null,
      regionId: null,
      userInfo: null,
    });
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('No refresh token available');
      const response = await fetch(`${API_BASE_URL2}api/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      if (response.ok) {
        const data = await response.json();
        setAuthTokens({ accessToken: data.access, refreshToken });
        setAuthState((prev) => ({ ...prev, accessToken: data.access }));
        return data.access;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      throw error;
    }
  };

  // Проверка прав доступа (по userRole)
  const hasRole = (role) => normalizeUserRole(authState.userRole) === normalizeUserRole(role);
  const hasAnyRole = (roles) => roles.map(normalizeUserRole).includes(normalizeUserRole(authState.userRole));
  const getUserRegion = () => authState.regionId;

  useEffect(() => {
    // Миграция: если в localStorage сохранена числовая роль, перезапишем строковой
    try {
      const raw = getUserRole();
      const normalized = normalizeUserRole(raw);
      if (raw && raw !== normalized) {
        setUserRole(normalized);
      }
    } catch {}

    setAuthState({
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken(),
      userRole: normalizeUserRole(getUserRole()),
      regionId: getRegionId(),
      userInfo: getUserInfo(),
    });

    // Учёт активных вкладок: инкремент при монтировании
    try {
      setActiveTabCount(getActiveTabCount() + 1);
    } catch {}

    const handleBeforeUnload = () => {
      try {
        const next = getActiveTabCount() - 1;
        setActiveTabCount(next);
        // Токены не очищаем на закрытии/обновлении вкладки
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Синхронизация между вкладками (login/logout/refresh)
    const onStorage = (e) => {
      if (!e.key) return;
      if (["accessToken","refreshToken","username","userInfo"].includes(e.key)) {
        const at = localStorage.getItem("accessToken");
        const rt = localStorage.getItem("refreshToken");
        const un = localStorage.getItem("username");
        const ui = JSON.parse(localStorage.getItem("userInfo") || "null");
        setAuthState({ accessToken: at, refreshToken: rt, username: un, userInfo: ui });
      }
      if (e.key === TABS_KEY) {
        // Ничего не делаем тут: счётчик нужен только для очистки на последней вкладке
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // На случай размонтирования без beforeunload: просто уменьшим счётчик
      try {
        const next = getActiveTabCount() - 1;
        setActiveTabCount(next);
      } catch {}
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        logout,
        refreshAccessToken,
        hasRole,
        hasAnyRole,
        getUserRegion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
