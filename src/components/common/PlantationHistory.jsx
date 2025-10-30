import React from 'react';

export default function PlantationHistory({
  data,
  loading,
  error,
  action,
  setAction,
  page,
  setPage,
  pageSize,
  onReload,
  title = "Tarix (o'zgarishlar)",
}) {
  const totalPages = Math.ceil((data?.count || 0) / (data?.page_size || pageSize || 1));

  return (
    <div className="mt-6 bg-gray-700 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-lg text-white">{title}</h2>
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-1 bg-gray-800 text-white border border-gray-600 rounded text-sm"
            value={action}
            onChange={(e) => setAction?.(e.target.value)}
          >
            <option value="">Barchasi</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="delete">Delete</option>
          </select>
          {onReload && (
            <button
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
              onClick={onReload}
            >
              Yuklash
            </button>
          )}
        </div>
      </div>

      {loading && <div className="text-gray-300">Yuklanmoqda...</div>}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && data?.results?.length === 0 && (
        <div className="text-gray-300">Tarix bo'sh</div>
      )}

      {!loading && !error && Array.isArray(data?.results) && data.results.map((log) => (
        <div key={log.id} className="border border-gray-600 rounded p-3 text-gray-200 bg-gray-800 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs rounded bg-gray-700 border border-gray-600">
                {log.action_display || log.action}
              </span>
              <span className="text-sm text-gray-300">{log.user_name || '—'}</span>
            </div>
            <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</div>
          </div>
          {Array.isArray(log.changed_fields) && log.changed_fields.length > 0 && (
            <div className="mt-2 text-sm text-gray-300">
              <span className="text-gray-400 mr-1">O'zgarishlar:</span>
              {log.changed_fields.join(", ")}
            </div>
          )}
          {log.moderation_comment && (
            <div className="mt-2 text-sm text-gray-300">
              <span className="text-gray-400 mr-1">Izoh:</span>
              {log.moderation_comment}
            </div>
          )}
        </div>
      ))}

      {!loading && data?.count > data?.page_size && (
        <div className="flex items-center justify-between pt-2">
          <button
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 border border-gray-600"
            disabled={page <= 1}
            onClick={() => setPage?.(Math.max(1, page - 1))}
          >
            Orqaga
          </button>
          <div className="text-xs text-gray-400">
            {page} / {totalPages}
          </div>
          <button
            className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 border border-gray-600"
            disabled={page >= totalPages}
            onClick={() => setPage?.(page + 1)}
          >
            Oldinga
          </button>
        </div>
      )}
    </div>
  );
}


