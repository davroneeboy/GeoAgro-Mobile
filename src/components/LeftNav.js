import React, { useEffect, useMemo, useState, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
import { UserOutlined, BookOutlined, SettingOutlined } from "@ant-design/icons";

const MENU_ITEMS = [
  {
    to: "/plantations/uz", label: "Bog'lar", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
      </svg>
    )
  },
  {
    to: "/statistics/regions", label: "Statistika", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    to: "/farmers", label: "Fermerlar", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  {
    to: "/moderation", label: "Moderatsiya", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    to: "/deletion-requests", label: "O'chirish so'rovlari", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  },
  {
    to: "/approved-plantations", label: "Tasdiqlangan", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
      </svg>
    )
  },
  {
    to: "/rejected-plantations", label: "Rad etilgan", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  },
  {
    to: "/archived-plantations", label: "O'chirilgan", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    )
  },
  {
    to: "/admin/logs", label: "Admin logs", icon: (
      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
];

const isHeadOfRegion = (role) => {
  if (!role) return false;
  const norm = String(role).toLowerCase();
  return norm === "headof_region" || norm === "headofregion" || norm === "headofregion";
};

const getMenuItemsByRole = (role, regionId) => {
  if (role === "superuser") {
    return [
      ...MENU_ITEMS.filter(item => item.to !== "/admin/logs" && item.to !== "/admin/performance" && item.to !== "/my/logs"),
      /* { to: "/admin", label: "Admin panel", icon: (
        <svg className="w-5 h-5 text-white" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
          <g>
            <path d="m58 5h-52c-3.3 0-6 2.7-6 6v32c0 3.3 2.7 6 6 6h17.8c-.3 2.1-1.2 5.2-3.6 6.1-.9.4-1.4 1.3-1.2 2.2s1 1.6 2 1.6h22.4c1 0 1.8-.7 2-1.6s-.3-1.9-1.2-2.2c-2.3-.9-3.4-3.9-3.8-6.1h17.6c3.3 0 6-2.7 6-6v-32c0-3.3-2.7-6-6-6zm-52 4h52c1.1 0 2 .9 2 2v26h-56v-26c0-1.1.9-2 2-2zm32.3 46h-12.3c1.2-2.1 1.7-4.4 1.9-6h8.4c.2 1.6.8 3.9 2 6zm19.7-10h-52c-1.1 0-2-.9-2-2v-2h56v2c0 1.1-.9 2-2 2z"/>
            <g>
              <path d="m39.6 30.4c.4.4.9.6 1.5.6.5 0 1.1-.2 1.5-.6l5.9-5.5c.8-.8.8-2 0-2.8l-5.9-5.5c-.8-.8-2.1-.8-2.9 0s-.8 2 0 2.8l4.4 4.2-4.4 4.2c-.9.6-.9 1.9-.1 2.6z"/>
              <path d="m24.4 16.6c-.4-.4-.9-.6-1.5-.6s-1.1.2-1.5.6l-5.9 5.5c-.8.8-.8 2 0 2.8l5.9 5.5c.8.8 2.1.8 2.9 0s.8-2 0-2.8l-4.3-4.1 4.4-4.2c.8-.7.8-2 0-2.7z"/>
              <path d="m27.9 35.9c.2.1.4.1.6.1.9 0 1.7-.6 1.9-1.4l6.9-21c.3-1.1-.3-2.2-1.3-2.5-1.1-.3-2.2.3-2.5 1.3l-6.9 21c-.3 1.1.3 2.2 1.3 2.5z"/>
            </g>
          </g>
        </svg>
      ) }, */
      {
        to: "/admin/logs", label: "Admin logs", icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      },
      {
        to: "/admin/performance", label: "Performance", icon: (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18M7 13l3 3 7-7" />
          </svg>
        )
      },
      {
        to: "/my/logs", label: "Mening loglarim", icon: (
          <BookOutlined className="w-5 h-5 text-white" />
        )
      },
    ];
  }
  if (isHeadOfRegion(role)) {
    const plantationsItem = MENU_ITEMS.find(item => item.to === "/plantations/uz");
    const farmersItem = MENU_ITEMS.find(item => item.to === "/farmers");
    const moderationItem = MENU_ITEMS.find(item => item.to === "/moderation");
    const deletionRequestsItem = MENU_ITEMS.find(item => item.to === "/deletion-requests");
    const approvedPlantationsItem = MENU_ITEMS.find(item => item.to === "/approved-plantations");
    const rejectedPlantationsItem = MENU_ITEMS.find(item => item.to === "/rejected-plantations");
    const archivedPlantationsItem = MENU_ITEMS.find(item => item.to === "/archived-plantations");

    const statsItem = regionId ? {
      to: `/statistics/regions/${regionId}`,
      label: "Statistika",
      icon: (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    } : null;

    return [
      plantationsItem,
      ...(statsItem ? [statsItem] : []),
      farmersItem,
      moderationItem,
      deletionRequestsItem,
      approvedPlantationsItem,
      rejectedPlantationsItem,
      archivedPlantationsItem,
      {
        to: "/my/logs", label: "Mening loglarim", icon: (
          <UserOutlined className="w-5 h-5 text-white" />
        )
      },
    ].filter(Boolean);
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
  return [MENU_ITEMS[0], {
    to: "/my/logs", label: "Mening loglarim", icon: (
      <UserOutlined className="w-6 h-6 text-white" />
    )
  }];
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

  useEffect(() => {
    try { localStorage.setItem('leftNavCollapsed', String(collapsed)); } catch { }
    try { window.dispatchEvent(new Event('leftnav-toggle')); } catch { }
  }, [collapsed]);


  const width = collapsed ? 72 : 344;
  const toggleLeft = width - 12; // РєРЅРѕРїРєР° Сѓ РїСЂР°РІРѕРіРѕ РєСЂР°СЏ РїР°РЅРµР»Рё, РЅРµ СЃРѕР·РґР°С‘С‚ РіРѕСЂРёР·РѕРЅС‚Р°Р»СЊРЅРѕРіРѕ СЃРєСЂРѕР»Р»Р°
  const effectiveRegionId = useMemo(() => {
    const fromAuth = authState?.regionId;
    const ui = authState?.userInfo || {};
    const fromUI = ui?.district?.region?.id || ui?.region?.id || ui?.region_id;
    return String(fromAuth || fromUI || '');
  }, [authState?.regionId, authState?.userInfo]);
  const items = useMemo(() => getMenuItemsByRole(authState?.userRole, effectiveRegionId), [authState?.userRole, effectiveRegionId]);
  const isActive = (to) => to.startsWith('/statistics') ? location.pathname.startsWith('/statistics') : location.pathname.startsWith(to);
  const statsSubItems = useMemo(() => {
    if (authState?.userRole === "superuser") {
      return [
        {
          to: '/statistics/regions', label: 'Viloyatlar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )
        },
        {
          to: '/statistics/fruits', label: 'Mevalar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" />
            </svg>
          )
        },
        {
          to: '/statistics/controllers', label: 'Nazoratchilar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        }
      ];
    }
    if (authState?.userRole === "headof_region") {
      const myRegion = effectiveRegionId;
      return [
        ...(myRegion ? [{
          to: `/statistics/regions/${myRegion}`, label: 'Viloyat statistikasi', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )
        }] : [])
      ];
    }
    if (authState?.userRole === "observer") {
      return [
        {
          to: '/statistics/regions', label: 'Viloyatlar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          )
        },
        {
          to: '/statistics/fruits', label: 'Mevalar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" />
            </svg>
          )
        },
        {
          to: '/statistics/controllers', label: 'Nazoratchilar', icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        }
      ];
    }
    return [];
  }, [authState?.userRole]);


  return (
    <aside className="fixed left-0 top-0 h-screen z-50 bg-gray-800 border-r border-gray-700 shadow-lg transition-all overflow-y-auto overflow-x-hidden no-scrollbar" style={{ width }}>
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
        {items.filter(item => !['/admin', '/admin/logs', '/admin/performance', '/my/logs'].includes(item.to)).map(item => {
          const active = isActive(item.to);
          const isStats = item.to === '/statistics/regions' || item.to.startsWith('/statistics/regions/');
          return (
            <div key={item.to}>
              <Link
                to={item.to}
                className={`block w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 transition-colors rounded-xl border-2 ${active ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={`inline-flex items-center justify-center ${collapsed ? 'w-6' : 'w-5'} h-5 text-white`}>{item.icon}</span>
                {!collapsed && <span className="truncate text-sm">{item.label}</span>}
              </Link>
              {!collapsed && location.pathname.startsWith('/statistics') && isStats && (
                <div className="ml-2 mt-1 space-y-2">
                  {statsSubItems.map(sub => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border w-full ${location.pathname.startsWith(sub.to) ? 'bg-green-700 text-white border-green-600' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                    >
                      <span className="inline-flex items-center justify-center w-4 h-4">{sub.icon}</span>
                      <span className="truncate">{sub.label}</span>
                    </Link>
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
        {authState?.userRole === 'superuser' && items.some(item => ['/admin', '/admin/logs', '/admin/performance', '/my/logs'].includes(item.to)) && (
          <div className="admin-block flex flex-col gap-2">
            {!collapsed && <div className="text-xs font-bold text-gray-400 uppercase px-4 pb-2 pt-1 tracking-widest flex items-center gap-2"><SettingOutlined className="text-base" /> Admin panel</div>}
            {items.filter(item => ['/admin', '/admin/logs', '/admin/performance', '/my/logs'].includes(item.to)).map(item => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 px-3 py-3 transition-colors rounded-lg border-2 mb-2 ${active ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600 hover:border-gray-500'}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`inline-flex items-center justify-center ${collapsed ? 'w-6' : 'w-5'} h-5 text-white`}>{item.icon}</span>
                  {!collapsed && <span className="truncate text-sm">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>


      {/* РљРЅРѕРїРєР° РІС‡РµСЂС‡РёРІР° РІ СѓРіР»Сѓ */}
      <button
        onClick={() => { try { logout?.(); } catch (e) { } navigate('/login'); }}
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
