import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExclamationCircleOutlined } from "@ant-design/icons";

// Хранилище уведомлений в localStorage
const STORAGE_KEY = "agro_notifications";

function loadNotifications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

function formatDate(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return "";
  return d.toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const defaultCreate = (overrides = {}) => ({
  id: Date.now(),
  type: "plantation:new",
  title: "Yangi bog' qo'shildi",
  message: "Yangi bog' qo'shildi, iltimos tekshiring",
  plantationId: null,
  createdAt: new Date().toISOString(),
  read: false,
  ...overrides,
});

export default function NotificationsPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => loadNotifications());

  // Экспорт мок-функции в window для тестов/интеграций позже
  useEffect(() => {
    window.addMockNotification = (payload = {}) => {
      const next = [defaultCreate(payload), ...notifications];
      setNotifications(next);
      saveNotifications(next);
    };
  }, [notifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const markAllAsRead = () => {
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    saveNotifications(next);
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const handleGoModeration = () => {
    setOpen(false);
    navigate("/moderation");
  };

  const handleOpenPlantation = (plantationId) => {
    setOpen(false);
    if (plantationId) navigate(`/plantations/${plantationId}`);
    else navigate("/moderation");
  };

  return (
    <div className="relative">
      {/* Кнопка-колокол */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
        title="Bildirishnomalar"
      >
        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающая панель */}
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[90vw] z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="text-sm font-semibold text-white">Bildirishnomalar</h3>
            <div className="flex items-center gap-2">
              <button onClick={markAllAsRead} className="text-xs text-gray-300 hover:text-white">Hammasini o'qilgan</button>
              <span className="text-gray-700">|</span>
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300">Tozalash</button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">Hozircha bildirishnoma yo'q</div>
          ) : (
            <ul className="max-h-96 overflow-auto divide-y divide-gray-700">
              {notifications.map((n) => (
                <li key={n.id} className={`p-4 ${n.read ? "bg-gray-800" : "bg-gray-800"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        {n.type === "security:alert" && (
                          <ExclamationCircleOutlined style={{ color: '#f59e42', fontSize: 18 }} />
                        )}
                        {n.title}
                      </p>
                      <p className={`text-xs mt-1 ${n.type === "security:alert" ? "text-orange-300" : "text-gray-300"}`}>{n.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className={`mt-1 h-2 w-2 rounded-full ${n.type === "security:alert" ? "bg-orange-400" : "bg-green-400"}`} />}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {n.type === "security:alert" ? (
                      <button
                        onClick={() => { setOpen(false); navigate('/admin/logs'); }}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded"
                      >
                        Смотреть логи
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenPlantation(n.plantationId)}
                        className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        Ko'rib chiqish
                      </button>
                    )}
                    <button
                      onClick={handleGoModeration}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded border border-gray-600"
                    >
                      Moderatsiya
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="px-4 py-3 border-t border-gray-700 text-[11px] text-gray-500">
            {`Dev: window.addMockNotification({ title: "Yangi bog'", plantationId: 123 });`}
          </div>
        </div>
      )}
    </div>
  );
} 