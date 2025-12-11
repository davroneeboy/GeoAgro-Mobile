import React from "react";

interface DistrictStats {
  total_plantations?: number;
  plantation_count?: number;
  approved_count?: number;
  approved?: number;
  pending_count?: number;
  pending?: number;
  moderation_count?: number;
  rejected_count?: number;
  rejected?: number;
  total_area?: number;
  area?: number;
}

interface MapDistrictStatsProps {
  stats: DistrictStats | null;
  loading: boolean;
  paginationCount?: number;
  compact?: boolean;
}

const StatIcon: React.FC = () => (
  <svg
    className="w-4 h-4 text-blue-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const LoadingSpinner: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className={`text-center ${compact ? "py-2" : "py-4"}`}>
    <div
      className={`inline-block animate-spin rounded-full border-b-2 border-blue-400 ${
        compact ? "h-5 w-5" : "h-6 w-6"
      }`}
      role="status"
      aria-label="Yuklanmoqda"
    />
    {!compact && <p className="text-gray-400 text-xs mt-2">Yuklanmoqda...</p>}
  </div>
);

const EmptyState: React.FC = () => (
  <p className="text-gray-500 text-sm text-center py-2">
    Statistika mavjud emas
  </p>
);

const MapDistrictStats: React.FC<MapDistrictStatsProps> = ({
  stats,
  loading,
  paginationCount = 0,
  compact = false,
}) => {
  if (loading) {
    return <LoadingSpinner compact={compact} />;
  }

  if (!stats) {
    return <EmptyState />;
  }

  const totalPlantations =
    stats.total_plantations || stats.plantation_count || paginationCount || 0;
  const approvedCount = stats.approved_count || stats.approved || 0;
  const pendingCount =
    stats.pending_count || stats.pending || stats.moderation_count || 0;
  const rejectedCount = stats.rejected_count || stats.rejected || 0;
  const totalArea = stats.total_area || stats.area || 0;

  if (compact) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-gray-800/50 rounded text-center">
          <span className="text-white font-bold text-lg block">
            {totalPlantations}
          </span>
          <span className="text-gray-400 text-xs">Jami</span>
        </div>
        <div className="p-2 bg-green-900/30 rounded text-center border border-green-700/50">
          <span className="text-green-400 font-bold text-lg block">
            {approvedCount}
          </span>
          <span className="text-green-300 text-xs">Tasdiqlangan</span>
        </div>
        <div className="p-2 bg-yellow-900/30 rounded text-center border border-yellow-700/50">
          <span className="text-yellow-400 font-bold text-lg block">
            {pendingCount}
          </span>
          <span className="text-yellow-300 text-xs">Moderatsiyada</span>
        </div>
        <div className="p-2 bg-red-900/30 rounded text-center border border-red-700/50">
          <span className="text-red-400 font-bold text-lg block">
            {rejectedCount}
          </span>
          <span className="text-red-300 text-xs">Rad etilgan</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Всего плантаций */}
      <div className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
        <span className="text-gray-400 text-sm">Jami bog'lar:</span>
        <span className="text-white font-bold text-lg">{totalPlantations}</span>
      </div>

      {/* Подтверждённые */}
      <div className="flex items-center justify-between p-2 bg-green-900/30 rounded-lg border border-green-700/50">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full bg-green-500"
            aria-hidden="true"
          />
          <span className="text-green-300 text-sm">Tasdiqlangan:</span>
        </div>
        <span className="text-green-400 font-bold text-lg">{approvedCount}</span>
      </div>

      {/* На модерации */}
      <div className="flex items-center justify-between p-2 bg-yellow-900/30 rounded-lg border border-yellow-700/50">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full bg-yellow-500"
            aria-hidden="true"
          />
          <span className="text-yellow-300 text-sm">Moderatsiyada:</span>
        </div>
        <span className="text-yellow-400 font-bold text-lg">{pendingCount}</span>
      </div>

      {/* Отклонённые */}
      <div className="flex items-center justify-between p-2 bg-red-900/30 rounded-lg border border-red-700/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" aria-hidden="true" />
          <span className="text-red-300 text-sm">Rad etilgan:</span>
        </div>
        <span className="text-red-400 font-bold text-lg">{rejectedCount}</span>
      </div>

      {/* Общая площадь */}
      {totalArea > 0 && (
        <div className="flex items-center justify-between p-2 bg-blue-900/30 rounded-lg border border-blue-700/50 mt-3">
          <span className="text-blue-300 text-sm">Umumiy maydon:</span>
          <span className="text-blue-400 font-bold">
            {totalArea.toLocaleString()} ga
          </span>
        </div>
      )}
    </div>
  );
};

// Обёртка с заголовком для использования в MapContainer
interface MapDistrictStatsCardProps extends MapDistrictStatsProps {
  className?: string;
}

export const MapDistrictStatsCard: React.FC<MapDistrictStatsCardProps> = ({
  stats,
  loading,
  paginationCount,
  compact = false,
  className = "",
}) => {
  return (
    <div
      className={`p-3 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg border border-gray-600 ${className}`}
    >
      <h5 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <StatIcon />
        Tuman statistikasi
      </h5>
      <MapDistrictStats
        stats={stats}
        loading={loading}
        paginationCount={paginationCount}
        compact={compact}
      />
    </div>
  );
};

export default MapDistrictStats;

