import { useCallback, useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import { apiRequest } from "../utils/apiUtils";

/**
 * usePlantationHistory
 * Универсальный хук для загрузки истории изменений плантации
 * @param {number|string} plantationId
 * @param {{ initialAction?: string, pageSize?: number }} options
 */
export function usePlantationHistory(plantationId, options = {}) {
  const { initialAction = "", pageSize = 50 } = options;
  const { authState, refreshAccessToken } = useContext(AuthContext);

  const [action, setAction] = useState(initialAction);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { count, page, page_size, results }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async (p = page, a = action) => {
    if (!plantationId) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("page_size", String(pageSize));
      if (a) params.set("action", a);

      const resp = await apiRequest(
        `api/plantations/${plantationId}/logs/?${params.toString()}`,
        { method: "GET" },
        refreshAccessToken,
        authState.accessToken
      );
      setData(resp || null);
      setPage(p);
    } catch (e) {
      setError(e?.message || "Tarixni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantationId, authState.accessToken, refreshAccessToken, pageSize, action, page]);

  useEffect(() => {
    fetchHistory(1, action);
  }, [plantationId, action, fetchHistory]);

  return {
    data,
    loading,
    error,
    action,
    setAction,
    page,
    setPage: (p) => fetchHistory(p, action),
    refetch: () => fetchHistory(page, action),
    pageSize,
  };
}

export default usePlantationHistory;


