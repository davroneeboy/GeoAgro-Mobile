import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import { API_BASE_URL1 } from "../config";
import AuthContext from "../context/AuthContext";
import ContactsPanel from "./ContactsPanel";
import { UserOutlined, BookOutlined, SettingOutlined } from "@ant-design/icons";

const MENU_ITEMS = [
  { to: "/plantations/uz", label: "Bog'lar", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
      </svg>
    ) },
  { to: "/statistics/regions", label: "Statistika", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ) },
  { to: "/farmers", label: "Fermerlar", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ) },
  { to: "/moderation", label: "Moderatsiya", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ) },
  { to: "/approved-plantations", label: "Tasdiqlangan", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    ) },
  { to: "/rejected-plantations", label: "Rad etilgan", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) },
  { to: "/controllers", label: "Nazoratchilar", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5 3V5a2 2 0 012-2h12a2 2 0 012 2v18l-5-3H9z" />
      </svg>
    ) },
  { to: "/admin/logs", label: "Admin logs", icon: (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ) },
];

const isHeadOfRegion = (role) => {
  if (!role) return false;
  const norm = String(role).toLowerCase();
  return norm === "headof_region" || norm === "headofregion" || norm === "headofregion";
};

const getMenuItemsByRole = (role) => {
  if (role === "superuser") {
    return [
      ...MENU_ITEMS.filter(item => item.to !== "/admin/logs" && item.to !== "/my/logs"),
      { to: "/admin/logs", label: "Admin logs", icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ) },
      { to: "/admin/performance", label: "Performance", icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M7 13l3 3 7-7" />
        </svg>
      ) },
      { to: "/my/logs", label: "Mening loglarim", icon: (
        <BookOutlined className="w-6 h-6 text-white" />
      ) },
    ];
  }
  if (isHeadOfRegion(role)) {
    const base = MENU_ITEMS.filter(item => [
      "/plantations/uz",
      "/statistics/regions",
      "/farmers"
    ].includes(item.to)).map(item => (item.to === "/statistics/regions" ? { ...item, to: "/statistics/controllers" } : item));
    return [
      ...base,
      { to: "/my/logs", label: "Mening loglarim", icon: (
        <UserOutlined className="w-6 h-6 text-white" />
      ) },
    ];
  }
  // Наблюдатель: карта UZ, статистика и список фермеров (без контролеров)
  if (String(role).toLowerCase() === 'observer') {
    const base = MENU_ITEMS.filter(item => [
      "/plantations/uz",
      "/statistics/regions",
      "/farmers"
    ].includes(item.to));
    return base;
  }
  if (!role) return MENU_ITEMS;
  return [MENU_ITEMS[0], { to: "/my/logs", label: "Mening loglarim", icon: (
    <UserOutlined className="w-6 h-6 text-white" />
  ) }];
};

const LeftNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { authState, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('leftNavCollapsed') ?? localStorage.getItem('rightNavCollapsed');
      return saved ? saved === 'true' : false;
    } catch { return false; }
  });

  const [controllers, setControllers] = useState([]);
  const [controllersOpen, setControllersOpen] = useState(false);
  const [visibleControllersCount, setVisibleControllersCount] = useState(5);

  useEffect(() => {
    try { localStorage.setItem('leftNavCollapsed', String(collapsed)); } catch {}
    try { window.dispatchEvent(new Event('leftnav-toggle')); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const res = await fetch(`${API_BASE_URL1}api/users/`, {
          headers: authState?.accessToken ? { Authorization: `Bearer ${authState.accessToken}` } : {},
        });
        const data = await res.json();
        const sorted = (Array.isArray(data) ? data : [])
          .filter(u => u.last_login)
          .sort((a, b) => new Date(b.last_login) - new Date(a.last_login));
        setControllers(sorted);
      } catch {}
    };
    if (location.pathname === '/' && authState?.accessToken) fetchControllers();
  }, [location.pathname, authState?.accessToken]);


  const width = collapsed ? 72 : 344;
  const toggleLeft = width - 12; // РєРЅРѕРїРєР° Сѓ РїСЂР°РІРѕРіРѕ РєСЂР°СЏ РїР°РЅРµР»Рё, РЅРµ СЃРѕР·РґР°С‘С‚ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ СЃРєСЂРѕР»Р»Р°
  const items = useMemo(() => getMenuItemsByRole(authState?.userRole), [authState?.userRole]);
  const isActive = (to) => to.startsWith('/statistics') ? location.pathname.startsWith('/statistics') : location.pathname.startsWith(to);
  const statsSubItems = useMemo(() => {
    if (authState?.userRole === "superuser") {
      return [
    { to: '/statistics/regions', label: 'Viloyatlar', icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ) },
    { to: '/statistics/fruits', label: 'Mevalar', icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" />
      </svg>
    ) },
    { to: '/statistics/controllers', label: 'Nazoratchilar', icon: (
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
        ) }
      ];
    }
    if (authState?.userRole === "headof_region") {
      return [
        { to: '/statistics/controllers', label: 'Nazoratchilar', icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) }
      ];
    }
    if (authState?.userRole === "observer") {
      return [
        { to: '/statistics/regions', label: 'Viloyatlar', icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
          </svg>
        ) },
        { to: '/statistics/fruits', label: 'Mevalar', icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" />
      </svg>
    ) },
        { to: '/statistics/controllers', label: 'Nazoratchilar', icon: (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) }
  ];
    }
    return [];
  }, [authState?.userRole]);

  const formatUserLocation = (u) => {
    const loc = u?.location || {};
    const region = loc.region ? `Region #${loc.region}` : '';
    const district = loc.district || '';
    return [region, district].filter(Boolean).join(', ') || 'No region/district assigned';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen z-50 bg-gray-800 border-r border-gray-700 shadow-lg transition-all overflow-y-auto overflow-x-hidden" style={{ width }}>
      <div className={`${collapsed ? 'relative h-16 justify-center' : 'h-16 justify-between py-2'} flex items-center px-3 border-b border-gray-700`}>
        <Link to="/" className={`flex items-center gap-2 ${collapsed ? 'justify-center mt-2' : ''} hover:opacity-90 transition-opacity`} title="Bosh sahifa">
          <img src={uzbekistanEmblem} alt="Logo" className="w-12 h-12 object-contain flex-none" />
          {!collapsed && (
            <p className="text-white font-semibold text-base leading-tight max-w-64 hidden sm:block mt-1">
              Qishloq xo'jaligi Vazirligi huzuridagi Agrosanoatni rivojlantirish agentligi
            </p>
          )}
        </Link>
        <button
          aria-label="Toggle"
          onClick={() => setCollapsed(v => !v)}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 shadow"
          style={{ position: 'fixed', top: 8, left: toggleLeft, zIndex: 60 }}
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          )}
        </button>
      </div>

      <nav className="py-3 px-2 space-y-3 mt-2">
        {/* Основные пункты меню */}
        {items.filter(item => !['/admin/logs','/admin/performance','/my/logs'].includes(item.to)).map(item => {
          const active = isActive(item.to);
          const isStats = item.to === '/statistics/regions';
          return (
            <div key={item.to}>
              {item.to === '/controllers' ? (
                <div
                  className={`block w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-3 rounded-lg border bg-gray-700 text-gray-400 border-gray-600 opacity-60 cursor-not-allowed pointer-events-none`}
                  title={collapsed ? item.label : 'Nazoratchilar (faol emas)'}
                  aria-disabled="true"
                >
                  <span className={`inline-flex items-center justify-center ${collapsed ? 'w-8' : 'w-6'} h-6 text-white`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
              ) : (
                <Link
                  to={item.to}
                  className={`block w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-4 transition-colors rounded-xl border-2 ${active ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`inline-flex items-center justify-center ${collapsed ? 'w-8' : 'w-6'} h-6 text-white`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )}
              {!collapsed && location.pathname.startsWith('/statistics') && isStats && (
                <div className="ml-2 mt-1 space-y-2">
                  {statsSubItems.map(sub => (
                    sub.to === '/statistics/controllers' ? (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border w-full ${location.pathname.startsWith(sub.to) ? 'bg-green-700 text-white border-green-600' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                      >
                        <span className="inline-flex items-center justify-center w-4 h-4">{sub.icon}</span>
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    ) : (
                      <Link
                        key={sub.to}
                        to={sub.to}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border w-full ${location.pathname.startsWith(sub.to) ? 'bg-green-700 text-white border-green-600' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                      >
                        <span className="inline-flex items-center justify-center w-4 h-4">{sub.icon}</span>
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    )
                  ))}
                </div>
              )}
               {/* В свернутом состоянии показываем подменю статистики сразу под иконкой статистики */}
               {collapsed && location.pathname.startsWith('/statistics') && isStats && (
                <div className='px-2 space-y-3 mt-2'>
                  {statsSubItems.map(sub => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      className={`block w-full flex items-center justify-center gap-3 px-3 py-4 transition-colors rounded-xl border-2 ${location.pathname.startsWith(sub.to) ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                      title={sub.label}
                    >
                      <span className='inline-flex items-center justify-center w-6 h-6 text-white'>{sub.icon}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {/* Admin block только для superuser */}
        {authState?.userRole === 'superuser' && items.some(item => ['/admin/logs','/admin/performance','/my/logs'].includes(item.to)) && (
          <div className="admin-block flex flex-col gap-2">
            {!collapsed && <div className="text-xs font-bold text-gray-400 uppercase px-4 pb-2 pt-1 tracking-widest flex items-center gap-2"><SettingOutlined className="text-base" /> Admin panel</div>}
            {items.filter(item => ['/admin/logs','/admin/performance','/my/logs'].includes(item.to)).map(item => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-4 py-4 transition-colors rounded-lg border-2 mb-2 ${active ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`inline-flex items-center justify-center ${collapsed ? 'w-8' : 'w-6'} h-6 text-white`}>{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
      
      {location.pathname === '/' && (
        <div className="px-3 pb-3 space-y-2">
                     <div>
                           <ContactsPanel buttonClassName={`w-full ${collapsed ? 'justify-center' : 'justify-between'} flex items-center text-white font-medium bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-2 rounded-lg border border-gray-600`} label={collapsed ? '' : 'Kontaktlar'} variant="full" />
           </div>
          <button onClick={() => setControllersOpen(v => !v)} className={`w-full ${collapsed ? 'justify-center' : 'justify-between'} flex items-center text-white font-medium mb-2 bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-2 rounded-lg border border-gray-600`} title={collapsed ? 'Nazoratchilar' : undefined}>
            <span className={`flex items-center gap-2 ${collapsed ? 'sr-only' : ''}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 10a4 4 0 118 0" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              {!collapsed && 'Nazoratchilar'}
            </span>
            {!collapsed && (
              <svg className={`w-4 h-4 transform transition-transform ${controllersOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            )}
          </button>

          {controllersOpen && (
            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
              {controllers.slice(0, visibleControllersCount).map((controller) => (
                <Link to="/controllers" key={controller.id} className={`block ${collapsed ? 'px-2 py-2' : 'p-3'} border border-gray-600 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors`} title={collapsed ? (controller.first_name || controller.last_name ? `${controller.first_name} ${controller.last_name}` : controller.username) : undefined}>
                  {!collapsed ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-white">{controller.first_name || controller.last_name ? `${controller.first_name} ${controller.last_name}` : controller.username}</h3>
                        <div className="h-2.5 w-2.5 bg-green-500 rounded-full"></div>
                      </div>
                      <p className="text-xs text-gray-400">{(() => { const iso = (controller.last_login || "").replace(" ", "T"); const d = new Date(iso); return isNaN(d) ? "вЂ”" : d.toLocaleString("uz-UZ", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); })()}</p>
                      <p className="text-xs text-gray-400">{formatUserLocation(controller)}</p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center"><div className="h-2.5 w-2.5 bg-green-500 rounded-full"></div></div>
                  )}
                </Link>
              ))}
              {controllers.length > 5 && !collapsed && (
                <div className="flex gap-2">
                  {visibleControllersCount < controllers.length && (
                    <button onClick={() => setVisibleControllersCount(c => Math.min(c + 5, controllers.length))} className="flex-1 bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors">Ko'proq ko'rsatish</button>
                  )}
                  {visibleControllersCount > 5 && (
                    <button onClick={() => setVisibleControllersCount(c => Math.max(5, c - 5))} className="flex-1 bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors">Kamhroq ko'rsatish</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* РљРЅРѕРїРєР° РІС‡РµСЂС‡РёРІР° РІ СѓРіР»Сѓ */}
      <button
        onClick={() => { try { logout?.(); } catch(e) {} navigate('/login'); }}
        title="Chiqish"
        className="p-2 rounded-full bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow"
        style={{ position: 'fixed', bottom: 12, left: 12, zIndex: 60 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
        </svg>
      </button>
    </aside>
  );
};

export default LeftNav; 








