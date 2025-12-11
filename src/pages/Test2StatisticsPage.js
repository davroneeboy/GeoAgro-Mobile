import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale,
} from "chart.js";
import { Doughnut, Bar, PolarArea } from "react-chartjs-2";
import AuthContext from "../context/AuthContext";
import { API_BASE_URL2 } from "../config";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  RadialLinearScale
);

// ═══════════════════════════════════════════════════════════════
// THEME SYSTEM
// ═══════════════════════════════════════════════════════════════
const theme = {
  bg: "from-slate-950 via-slate-900 to-slate-950",
  card: "from-slate-800/60 to-slate-900/80",
  cardBorder: "border-slate-700/40",
  text: "text-slate-100",
  textMuted: "text-slate-400",
  accent: "from-emerald-400 via-cyan-400 to-blue-500",
};

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════
const AnimatedNumber = ({ value, duration = 2000, format = "number", decimals = 0 }) => {
  const [display, setDisplay] = useState(0);
  const startTime = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    if (value === undefined || value === null) return;
    const target = Number(value) || 0;
    
    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(target * eased);
      
      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };
    
    startTime.current = null;
    rafId.current = requestAnimationFrame(animate);
    
    return () => rafId.current && cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  const formatValue = (v) => {
    if (format === "currency") {
      if (v >= 1e12) return `${(v / 1e12).toFixed(1)} trln`;
      if (v >= 1e9) return `${(v / 1e9).toFixed(1)} mlrd`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(1)} mln`;
      return v.toLocaleString("uz-UZ");
    }
    if (format === "percent") return `${v.toFixed(decimals)}%`;
    if (format === "area") return `${v.toLocaleString("uz-UZ", { maximumFractionDigits: 0 })} ga`;
    return v.toLocaleString("uz-UZ", { maximumFractionDigits: decimals });
  };

  return <span>{formatValue(display)}</span>;
};

// ═══════════════════════════════════════════════════════════════
// GLASSMORPHIC CARD
// ═══════════════════════════════════════════════════════════════
const GlassCard = ({ children, className = "", delay = 0, hover = true, onClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-white/[0.08] to-white/[0.02]
        backdrop-blur-xl border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        transform transition-all duration-700 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
        ${hover ? "hover:scale-[1.02] hover:shadow-[0_16px_48px_rgba(0,0,0,0.2)] hover:border-white/[0.15] cursor-pointer" : ""}
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// KPI METRIC CARD
// ═══════════════════════════════════════════════════════════════
const MetricCard = ({ title, value, subtitle, icon, gradient, format = "number", delay = 0, trend, isDark }) => {
  const gradients = {
    emerald: "from-emerald-500/20 via-emerald-600/10 to-transparent",
    cyan: "from-cyan-500/20 via-cyan-600/10 to-transparent",
    blue: "from-blue-500/20 via-blue-600/10 to-transparent",
    purple: "from-purple-500/20 via-purple-600/10 to-transparent",
    amber: "from-amber-500/20 via-amber-600/10 to-transparent",
    rose: "from-rose-500/20 via-rose-600/10 to-transparent",
  };

  const iconColors = {
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  const ringColors = {
    emerald: "ring-emerald-500/30",
    cyan: "ring-cyan-500/30",
    blue: "ring-blue-500/30",
    purple: "ring-purple-500/30",
    amber: "ring-amber-500/30",
    rose: "ring-rose-500/30",
  };

  return (
    <GlassCard delay={delay} className="p-5">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[gradient]} rounded-2xl`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2.5 rounded-xl bg-white/[0.08] ring-1 ${ringColors[gradient]}`}>
            <span className={iconColors[gradient]}>{icon}</span>
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
              trend >= 0 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/20 text-rose-400"
            }`}>
              {trend >= 0 ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
        
        <p className={`text-xs uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {title}
        </p>
        
        <p className={`text-2xl xl:text-3xl font-bold tracking-tight mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>
          <AnimatedNumber value={value} format={format} duration={2000 + delay} />
        </p>
        
        {subtitle && (
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>
        )}
      </div>
    </GlassCard>
  );
};

// ═══════════════════════════════════════════════════════════════
// CIRCULAR PROGRESS
// ═══════════════════════════════════════════════════════════════
const CircularProgress = ({ value, max, label, color = "emerald", size = 80, isDark }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const colors = {
    emerald: { stroke: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
    cyan: { stroke: "#06b6d4", bg: "rgba(6, 182, 212, 0.2)" },
    purple: { stroke: "#a855f7", bg: "rgba(168, 85, 247, 0.2)" },
    amber: { stroke: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" },
    rose: { stroke: "#f43f5e", bg: "rgba(244, 63, 94, 0.2)" },
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[color].bg}
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors[color].stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {animatedValue.toFixed(0)}%
          </span>
        </div>
      </div>
      <span className={`text-xs mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// REGION BAR
// ═══════════════════════════════════════════════════════════════
const RegionBar = ({ region, maxCount, delay, isDark, onClick }) => {
  const [width, setWidth] = useState(0);
  const percentage = maxCount > 0 ? (region.plantations_count / maxCount) * 100 : 0;
  const approvedPercent = region.plantations_count > 0 
    ? (region.approved_count / region.plantations_count) * 100 
    : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div 
      onClick={() => onClick?.(region)}
      className={`
        group p-3 rounded-xl cursor-pointer transition-all duration-300
        ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-slate-100/50"}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`font-medium text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>
          {region.name}
        </span>
        <div className="flex items-center gap-3">
          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {region.total_area?.toLocaleString()} га
          </span>
          <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>
            {region.plantations_count?.toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700/50" : "bg-slate-200"}`}>
        <div className="h-full flex transition-all duration-1000 ease-out" style={{ width: `${width}%` }}>
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            style={{ width: `${approvedPercent}%` }}
          />
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
            style={{ width: `${100 - approvedPercent}%` }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {region.approved_count?.toLocaleString()} tasdiqlangan
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {region.pending_count?.toLocaleString()} kutilmoqda
          </span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ACTIVITY ITEM
// ═══════════════════════════════════════════════════════════════
const ActivityItem = ({ activity, type, isDark, delay }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (hours < 1) return "Hozirgina";
    if (hours < 24) return `${hours} soat oldin`;
    if (days < 7) return `${days} kun oldin`;
    return date.toLocaleDateString("uz-UZ");
  };

  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-xl transition-all duration-500
      ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}
      ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}
    `}>
      <div className={`
        flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
        ${type === "plantation" 
          ? "bg-emerald-500/20 text-emerald-400" 
          : "bg-cyan-500/20 text-cyan-400"}
      `}>
        {type === "plantation" ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium text-sm truncate ${isDark ? "text-slate-200" : "text-slate-700"}`}>
            {type === "plantation" ? activity.district__name : activity.district__name}
          </span>
          <span className={`text-xs flex-shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {formatDate(type === "plantation" ? activity.created_at : activity.moderated_at)}
          </span>
        </div>
        <div className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          {type === "plantation" 
            ? `@${activity.created_by__username} · ${activity.total_area?.toFixed(1)} ga`
            : `@${activity.moderated_by__username} · ${activity.is_rejected ? "Rad etilgan" : "Tasdiqlangan"}`}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT MINI CARD
// ═══════════════════════════════════════════════════════════════
const StatMini = ({ label, value, color = "slate", isDark }) => {
  const colors = {
    emerald: isDark ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-emerald-50 text-emerald-600 ring-emerald-200",
    cyan: isDark ? "bg-cyan-500/10 text-cyan-400 ring-cyan-500/20" : "bg-cyan-50 text-cyan-600 ring-cyan-200",
    amber: isDark ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" : "bg-amber-50 text-amber-600 ring-amber-200",
    rose: isDark ? "bg-rose-500/10 text-rose-400 ring-rose-500/20" : "bg-rose-50 text-rose-600 ring-rose-200",
    purple: isDark ? "bg-purple-500/10 text-purple-400 ring-purple-500/20" : "bg-purple-50 text-purple-600 ring-purple-200",
    blue: isDark ? "bg-blue-500/10 text-blue-400 ring-blue-500/20" : "bg-blue-50 text-blue-600 ring-blue-200",
    slate: isDark ? "bg-slate-500/10 text-slate-400 ring-slate-500/20" : "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <div className={`px-3 py-2 rounded-xl ring-1 ${colors[color]}`}>
      <div className="text-xs opacity-70 mb-0.5">{label}</div>
      <div className="font-bold text-lg">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CHART WRAPPER
// ═══════════════════════════════════════════════════════════════
const ChartWrapper = ({ title, subtitle, children, isDark, action }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
        {subtitle && (
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>
        )}
      </div>
      {action}
    </div>
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════════════════
const Icons = {
  plantation: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  farmers: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  area: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  pending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  investment: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  water: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

// ═══════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════
const LoadingSkeleton = () => (
  <div className={`min-h-screen bg-gradient-to-br ${theme.bg} p-4 md:p-6 lg:p-8`}>
    <div className="max-w-[1600px] mx-auto">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-10 w-72 rounded-xl bg-slate-800 animate-pulse" />
          <div className="h-4 w-48 rounded-lg mt-3 bg-slate-800 animate-pulse" />
        </div>
        <div className="h-10 w-24 rounded-xl bg-slate-800 animate-pulse" />
      </div>
      
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-800/50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-80 rounded-2xl bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const Test2StatisticsPage = () => {
  const { authState } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [regionSort, setRegionSort] = useState("count");
  const isDark = true; // Только тёмная тема

  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = { "Content-Type": "application/json" };
      if (authState.accessToken) {
        headers.Authorization = `Bearer ${authState.accessToken}`;
      }

      const [statsRes, dashboardRes] = await Promise.all([
        fetch(`${API_BASE_URL2}api/statistics/`, { headers }),
        fetch(`${API_BASE_URL2}api/admin/dashboard/`, { headers }),
      ]);

      if (!statsRes.ok) throw new Error("Statistikani yuklashda xatolik");
      if (!dashboardRes.ok) throw new Error("Dashboardni yuklashda xatolik");

      const [statsData, dashboardData] = await Promise.all([
        statsRes.json(),
        dashboardRes.json(),
      ]);

      setStats(statsData);
      setDashboard(dashboardData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authState.accessToken]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Auto-refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchData]);

  // ─────────────────────────────────────────────────────────────
  // MEMOIZED DATA
  // ─────────────────────────────────────────────────────────────
  const sortedRegions = useMemo(() => {
    if (!dashboard?.regions) return [];
    const regions = [...dashboard.regions];
    
    switch (regionSort) {
      case "count":
        return regions.sort((a, b) => b.plantations_count - a.plantations_count);
      case "area":
        return regions.sort((a, b) => b.total_area - a.total_area);
      case "approved":
        return regions.sort((a, b) => b.approved_count - a.approved_count);
      case "pending":
        return regions.sort((a, b) => b.pending_count - a.pending_count);
      case "name":
        return regions.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return regions;
    }
  }, [dashboard?.regions, regionSort]);

  const maxRegionCount = useMemo(() => {
    if (!sortedRegions.length) return 0;
    return Math.max(...sortedRegions.map(r => r.plantations_count));
  }, [sortedRegions]);

  // ─────────────────────────────────────────────────────────────
  // CHART CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────
  const chartColors = {
    emerald: "rgb(16, 185, 129)",
    emeraldLight: "rgba(16, 185, 129, 0.2)",
    amber: "rgb(245, 158, 11)",
    amberLight: "rgba(245, 158, 11, 0.2)",
    rose: "rgb(244, 63, 94)",
    roseLight: "rgba(244, 63, 94, 0.2)",
    cyan: "rgb(6, 182, 212)",
    cyanLight: "rgba(6, 182, 212, 0.2)",
    purple: "rgb(168, 85, 247)",
    purpleLight: "rgba(168, 85, 247, 0.2)",
    blue: "rgb(59, 130, 246)",
    blueLight: "rgba(59, 130, 246, 0.2)",
  };

  const baseChartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1200, easing: "easeOutQuart" },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#f1f5f9" : "#1e293b",
        bodyColor: isDark ? "#94a3b8" : "#64748b",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  }), [isDark]);

  const statusChartData = useMemo(() => {
    if (!stats?.plantations) return null;
    return {
      labels: ["Tasdiqlangan", "Kutilmoqda", "Rad etilgan"],
      datasets: [{
        data: [
          stats.plantations.approved_plantations,
          stats.plantations.pending_plantations,
          stats.plantations.rejected_plantations,
        ],
        backgroundColor: [chartColors.emerald, chartColors.amber, chartColors.rose],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    };
  }, [stats?.plantations]);

  const typesChartData = useMemo(() => {
    if (!stats?.plantation_types) return null;
    return {
      labels: ["Bog'lar", "Uzumzorlar", "Issiqxonalar"],
      datasets: [{
        label: "Soni",
        data: [
          stats.plantation_types.bogs_count,
          stats.plantation_types.uzumzors_count,
          stats.plantation_types.issiqxonas_count,
        ],
        backgroundColor: [
          chartColors.blueLight,
          chartColors.purpleLight,
          chartColors.cyanLight,
        ],
        borderColor: [chartColors.blue, chartColors.purple, chartColors.cyan],
        borderWidth: 2,
        borderRadius: 8,
      }],
    };
  }, [stats?.plantation_types]);

  const userRolesData = useMemo(() => {
    if (!dashboard?.users?.by_role) return null;
    const roles = dashboard.users.by_role;
    return {
      labels: ["Oddiy", "Superadminlar", "Viloyat rahbarlari", "Kuzatuvchilar"],
      datasets: [{
        data: [roles.regular, roles.superuser, roles.head_of_region, roles.only_view],
        backgroundColor: [
          chartColors.blueLight,
          chartColors.roseLight,
          chartColors.purpleLight,
          chartColors.cyanLight,
        ],
        borderColor: [chartColors.blue, chartColors.rose, chartColors.purple, chartColors.cyan],
        borderWidth: 2,
      }],
    };
  }, [dashboard?.users?.by_role]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  if (loading && !stats && !dashboard) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.bg} flex items-center justify-center p-4`}>
        <GlassCard className="p-8 max-w-md text-center" hover={false}>
          <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
            Yuklashda xatolik
          </h2>
          <p className={`text-sm mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Qayta urinib ko'ring
          </button>
        </GlassCard>
      </div>
    );
  }

  const { plantations, plantation_types, fruits, irrigation, fertility, investment, subsidy, economic_areas } = stats || {};
  const { overview, users, moderation, recent_activities, trends } = dashboard || {};

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bg}`}>

      <div className="relative z-10 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto">
          
          {/* ═══════════════════════════════════════════════════════════
              HEADER
          ═══════════════════════════════════════════════════════════ */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                <span>Agrosanoat</span>
                <span className="opacity-50 ml-2 font-light">Dashboard</span>
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Agrosanoatni rivojlantirish agentligi statistik ma'lumotlar tizimi
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Yangilangan: {lastUpdate.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              
              <button
                onClick={fetchData}
                disabled={loading}
                className={`p-2.5 rounded-xl transition-all bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 ${loading ? "animate-spin" : ""}`}
              >
                {Icons.refresh}
              </button>
            </div>
          </header>

          {/* ═══════════════════════════════════════════════════════════
              KPI CARDS
          ═══════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <MetricCard
              title="Plantatsiyalar"
              value={overview?.total_plantations}
              subtitle={`+${dashboard?.plantations?.created_this_month || 0} shu oyda`}
              icon={Icons.plantation}
              gradient="emerald"
              delay={0}
              trend={trends?.plantations_change_percent}
              isDark={isDark}
            />
            <MetricCard
              title="Fermerlar"
              value={overview?.total_farmers}
              icon={Icons.farmers}
              gradient="amber"
              delay={100}
              isDark={isDark}
            />
            <MetricCard
              title="Maydon"
              value={plantations?.total_area}
              format="area"
              icon={Icons.area}
              gradient="cyan"
              delay={200}
              isDark={isDark}
            />
            <MetricCard
              title="Moderatsiyada"
              value={overview?.pending_moderation}
              subtitle={`O'rtacha vaqt: ${moderation?.average_moderation_time?.toFixed(0) || 0} soat`}
              icon={Icons.pending}
              gradient="purple"
              delay={300}
              isDark={isDark}
            />
            <MetricCard
              title="Foydalanuvchilar"
              value={overview?.total_users}
              subtitle={`${users?.active_today || 0} bugun faol`}
              icon={Icons.users}
              gradient="blue"
              delay={400}
              isDark={isDark}
            />
            <MetricCard
              title="Investitsiyalar"
              value={investment?.total_investment}
              format="currency"
              subtitle="Jami kiritilgan"
              icon={Icons.investment}
              gradient="rose"
              delay={500}
              isDark={isDark}
            />
          </section>

          {/* ═══════════════════════════════════════════════════════════
              MAIN CHARTS ROW
          ═══════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {/* Status Distribution */}
            <GlassCard className="p-5" delay={200}>
              <ChartWrapper title="Plantatsiyalar holati" subtitle="Holatlar bo'yicha taqsimot" isDark={isDark}>
                <div className="h-56">
                  {statusChartData && (
                    <Doughnut 
                      data={statusChartData} 
                      options={{
                        ...baseChartOptions,
                        cutout: "70%",
                        plugins: {
                          ...baseChartOptions.plugins,
                          legend: { display: false },
                        },
                      }} 
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <StatMini label="Tasdiqlangan" value={plantations?.approved_plantations} color="emerald" isDark={isDark} />
                  <StatMini label="Kutilmoqda" value={plantations?.pending_plantations} color="amber" isDark={isDark} />
                  <StatMini label="Rad etilgan" value={plantations?.rejected_plantations} color="rose" isDark={isDark} />
                </div>
              </ChartWrapper>
            </GlassCard>

            {/* Plantation Types */}
            <GlassCard className="p-5" delay={300}>
              <ChartWrapper title="Plantatsiya turlari" subtitle="Toifalar bo'yicha" isDark={isDark}>
                <div className="h-56">
                  {typesChartData && (
                    <Bar 
                      data={typesChartData} 
                      options={{
                        ...baseChartOptions,
                        indexAxis: "y",
                        scales: {
                          x: {
                            grid: { color: isDark ? "rgba(100,116,139,0.1)" : "rgba(100,116,139,0.1)", drawBorder: false },
                            ticks: { color: isDark ? "#64748b" : "#94a3b8" },
                          },
                          y: {
                            grid: { display: false },
                            ticks: { color: isDark ? "#94a3b8" : "#64748b" },
                          },
                        },
                      }} 
                    />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <StatMini label="Bog'lar" value={plantation_types?.bogs_count} color="blue" isDark={isDark} />
                  <StatMini label="Uzumzorlar" value={plantation_types?.uzumzors_count} color="purple" isDark={isDark} />
                  <StatMini label="Issiqxonalar" value={plantation_types?.issiqxonas_count} color="cyan" isDark={isDark} />
                </div>
              </ChartWrapper>
            </GlassCard>

            {/* Fertility & Irrigation */}
            <GlassCard className="p-5" delay={400}>
              <ChartWrapper title="Unumdorlik va Sug'orish" subtitle="Asosiy ko'rsatkichlar" isDark={isDark}>
                <div className="flex items-center justify-around py-4">
                  <CircularProgress 
                    value={fertility?.high_fertility_count || 0}
                    max={(fertility?.high_fertility_count || 0) + (fertility?.low_fertility_count || 0)}
                    label="Unumdorlik"
                    color="emerald"
                    isDark={isDark}
                  />
                  <CircularProgress 
                    value={irrigation?.irrigated_plantations || 0}
                    max={(irrigation?.irrigated_plantations || 0) + (irrigation?.non_irrigated_plantations || 0)}
                    label="Sug'orish"
                    color="cyan"
                    isDark={isDark}
                  />
                  <CircularProgress 
                    value={economic_areas?.planted_area || 0}
                    max={(economic_areas?.planted_area || 0) + (economic_areas?.economic_inefficient_area || 0) + (economic_areas?.not_usable_area || 0)}
                    label="Ekilgan"
                    color="purple"
                    isDark={isDark}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <StatMini 
                    label="O'rt. unumdorlik" 
                    value={`${fertility?.avg_fertility_score?.toFixed(1) || 0}%`} 
                    color="emerald" 
                    isDark={isDark} 
                  />
                  <StatMini 
                    label="Sug'oriladigan" 
                    value={`${irrigation?.total_irrigation_area?.toLocaleString() || 0} ga`} 
                    color="cyan" 
                    isDark={isDark} 
                  />
                </div>
              </ChartWrapper>
            </GlassCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              REGIONS & ACTIVITY
          ═══════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
            {/* Regions List */}
            <GlassCard className="p-5 xl:col-span-2" delay={500} hover={false}>
              <ChartWrapper 
                title="Viloyatlar" 
                subtitle={`${sortedRegions.length} ta viloyat`}
                isDark={isDark}
                action={
                  <select
                    value={regionSort}
                    onChange={(e) => setRegionSort(e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border-none outline-none ${
                      isDark 
                        ? "bg-white/[0.05] text-slate-300" 
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <option value="count">Soni bo'yicha</option>
                    <option value="area">Maydon bo'yicha</option>
                    <option value="approved">Tasdiqlanganlar</option>
                    <option value="pending">Kutilayotganlar</option>
                    <option value="name">Nomi bo'yicha</option>
                  </select>
                }
              >
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedRegions.map((region, idx) => (
                    <RegionBar 
                      key={region.id} 
                      region={region} 
                      maxCount={maxRegionCount}
                      delay={idx * 50}
                      isDark={isDark}
                      onClick={setSelectedRegion}
                    />
                  ))}
                </div>
              </ChartWrapper>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="p-5" delay={600} hover={false}>
              <ChartWrapper 
                title="So'nggi faollik" 
                subtitle="Plantatsiyalar va moderatsiya"
                isDark={isDark}
              >
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {recent_activities?.recent_plantations?.slice(0, 5).map((activity, idx) => (
                    <ActivityItem 
                      key={`p-${activity.id}`}
                      activity={activity}
                      type="plantation"
                      isDark={isDark}
                      delay={idx * 100}
                    />
                  ))}
                  <div className={`my-3 border-t ${isDark ? "border-slate-700/50" : "border-slate-200"}`} />
                  {recent_activities?.recent_moderations?.slice(0, 5).map((activity, idx) => (
                    <ActivityItem 
                      key={`m-${activity.id}`}
                      activity={activity}
                      type="moderation"
                      isDark={isDark}
                      delay={(idx + 5) * 100}
                    />
                  ))}
                </div>
              </ChartWrapper>
            </GlassCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              BOTTOM STATS
          ═══════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <GlassCard className="p-4 col-span-2" delay={700}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Subsidiyalar</p>
                  <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    <AnimatedNumber value={subsidy?.total_subsidy_amount} format="currency" />
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {subsidy?.subsidized_plantations} ta oluvchi
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 col-span-2" delay={750}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                  {Icons.water}
                </div>
                <div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Sug'orish</p>
                  <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {irrigation?.irrigation_percentage?.toFixed(1)}%
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {irrigation?.irrigated_plantations?.toLocaleString()} ta uchastka
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 col-span-2" delay={800}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ekinlar</p>
                  <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {fruits?.fruits_count} ta tur
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {fruits?.varieties_count} ta nav
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 col-span-2" delay={850}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>KPI ballar</p>
                  <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    <AnimatedNumber value={users?.total_kpi_points} />
                  </p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    jami to'plangan
                  </p>
                </div>
              </div>
            </GlassCard>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              USER ROLES & TRENDS
          ═══════════════════════════════════════════════════════════ */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Roles */}
            <GlassCard className="p-5" delay={900}>
              <ChartWrapper title="Foydalanuvchilar rollari" subtitle="Ruxsat taqsimoti" isDark={isDark}>
                <div className="h-48">
                  {userRolesData && (
                    <PolarArea 
                      data={userRolesData} 
                      options={{
                        ...baseChartOptions,
                        scales: {
                          r: {
                            grid: { color: isDark ? "rgba(100,116,139,0.1)" : "rgba(100,116,139,0.2)" },
                            ticks: { display: false },
                          },
                        },
                      }} 
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <StatMini label="Oddiy" value={users?.by_role?.regular} color="blue" isDark={isDark} />
                  <StatMini label="Superadmin" value={users?.by_role?.superuser} color="rose" isDark={isDark} />
                  <StatMini label="Rahbarlar" value={users?.by_role?.head_of_region} color="purple" isDark={isDark} />
                  <StatMini label="Kuzatuvchilar" value={users?.by_role?.only_view} color="cyan" isDark={isDark} />
                </div>
              </ChartWrapper>
            </GlassCard>

            {/* Weekly Stats */}
            <GlassCard className="p-5" delay={950} hover={false}>
              <ChartWrapper title="Davr statistikasi" subtitle="Yaratish va moderatsiya" isDark={isDark}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className={`p-4 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                    <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Bugun yaratilgan</p>
                    <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {dashboard?.plantations?.created_today || 0}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                    <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Hafta davomida</p>
                    <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {dashboard?.plantations?.created_this_week || 0}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                    <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Oy davomida</p>
                    <p className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {dashboard?.plantations?.created_this_month || 0}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}`}>
                    <p className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Trend</p>
                    <p className={`text-3xl font-bold ${
                      (trends?.plantations_change_percent || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {trends?.plantations_change_percent > 0 ? "+" : ""}{trends?.plantations_change_percent?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10" : "bg-gradient-to-r from-emerald-50 to-cyan-50"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Oylik faol foydalanuvchilar</p>
                      <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                        {users?.active_this_month || 0}
                      </p>
                    </div>
                    <div className={`text-right`}>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Bugun faol</p>
                      <p className={`text-2xl font-bold text-emerald-400`}>
                        {users?.active_today || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </ChartWrapper>
            </GlassCard>
          </section>
        </div>
      </div>

      {/* Region Detail Modal */}
      {selectedRegion && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedRegion(null)}
        >
          <GlassCard 
            className="p-6 max-w-md w-full" 
            delay={0}
            hover={false}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {selectedRegion.name}
                </h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {selectedRegion.users_count} ta foydalanuvchi
                </p>
              </div>
              <button 
                onClick={() => setSelectedRegion(null)}
                className={`p-2 rounded-lg ${isDark ? "hover:bg-white/[0.1]" : "hover:bg-slate-100"}`}
              >
                <svg className={`w-5 h-5 ${isDark ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-xl ${isDark ? "bg-white/[0.05]" : "bg-slate-50"}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-slate-400" : "text-slate-500"}>Jami plantatsiyalar</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {selectedRegion.plantations_count?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-emerald-400" : "text-emerald-600"}>Tasdiqlangan</span>
                  <span className="font-bold text-emerald-500">
                    {selectedRegion.approved_count?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? "bg-amber-500/10" : "bg-amber-50"}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-amber-400" : "text-amber-600"}>Moderatsiyada</span>
                  <span className="font-bold text-amber-500">
                    {selectedRegion.pending_count?.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${isDark ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? "text-cyan-400" : "text-cyan-600"}>Maydon</span>
                  <span className="font-bold text-cyan-500">
                    {selectedRegion.total_area?.toLocaleString()} ga
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? "rgba(100, 116, 139, 0.3)" : "rgba(100, 116, 139, 0.2)"};
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "rgba(100, 116, 139, 0.5)" : "rgba(100, 116, 139, 0.4)"};
        }
      `}</style>
    </div>
  );
};

export default Test2StatisticsPage;

