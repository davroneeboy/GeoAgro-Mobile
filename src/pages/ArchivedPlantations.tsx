import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import axios, { AxiosError } from "axios";
import { API_BASE_URL2 } from "../config";
import { useNavigate, useLocation, Link } from "react-router-dom";
import uzbekistanEmblem from "../assets/images/uzb-gerb.png";
import AuthContext from "../context/AuthContext";
import { Plantation, User, ApiResponse } from "../types";
import {
  getRegionNameById,
  getFiltersFromUrl as getFiltersFromUrlUtil,
  saveFiltersToUrl as saveFiltersToUrlUtil,
  getRegionOptions,
  getDistrictsByRegion,
  BaseFilters
} from "../utils/moderationFilters";

// Типы для фильтров
interface Filters extends BaseFilters {
  crop_type: string;
}

const ArchivedPlantations: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, logout } = useContext(AuthContext);
  
  const [plantations, setPlantations] = useState<Plantation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);
  const [users, setUsers] = useState<Record<number, User>>({});
  const loadingUsersRef = useRef<Set<number>>(new Set());
  const loadedUsersRef = useRef<Set<number>>(new Set());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  
  const initialPageFromUrl = ((): number => {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = parseInt(urlParams.get("page") || "1", 10);
    const savedPage = parseInt(localStorage.getItem('archivedPlantationsPage') || "1", 10);
    
    const pageToUse = urlParams.get("page") ? pageParam : savedPage;
    const validPage = pageToUse > 0 ? pageToUse : 1;
    
    if (!urlParams.get("page") && savedPage !== validPage) {
      window.history.replaceState(null, '', `/archived-plantations?page=${validPage}`);
    }
    
    return validPage;
  })();
  
  const [page, setPage] = useState<number>(initialPageFromUrl);
  const [pageInput, setPageInput] = useState<string>(initialPageFromUrl.toString());

  const getFiltersFromUrl = (): Filters => {
    const defaultFilters: Filters = {
      region: 'All',
      district: 'All',
      crop_type: 'All',
      farmer: 'All',
      plantation_id: 'All'
    };
    return getFiltersFromUrlUtil(location, defaultFilters);
  };

  const saveFiltersToUrl = (newFilters: Filters, newPage: number = 1): void => {
    saveFiltersToUrlUtil(navigate, '/archived-plantations', newFilters, newPage);
    localStorage.setItem('archivedPlantationsPage', newPage.toString());
  };

  const [filters, setFilters] = useState<Filters>(() => getFiltersFromUrl());

  const pageSize: number = 20;
  const totalPages: number = Math.ceil(count / pageSize);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const newPage = parseInt(pageInput, 10);
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setPageInput('');
      saveFiltersToUrl(filters, newPage);
    }
  };

  const goToFirstPage = (): void => {
    setPage(1);
    setPageInput('1');
    saveFiltersToUrl(filters, 1);
  };
  
  const goToLastPage = (): void => {
    setPage(totalPages);
    setPageInput(totalPages.toString());
    saveFiltersToUrl(filters, totalPages);
  };

  const handleFilterChange = (filterType: keyof Filters, value: string): void => {
    setFilters(prev => {
      const newFilters: Filters = { ...prev, [filterType]: value };
      if (filterType === 'region') {
        newFilters.district = 'All';
      }
      saveFiltersToUrl(newFilters, 1);
      return newFilters;
    });
    
    setPage(1);
    localStorage.setItem('archivedPlantationsPage', '1');
  };

  const handleResetFilters = (): void => {
    const resetFilters: Filters = {
      region: 'All',
      district: 'All',
      crop_type: 'All',
      farmer: 'All',
      plantation_id: 'All'
    };
    setFilters(resetFilters);
    setPage(1);
    saveFiltersToUrl(resetFilters, 1);
  };


  const getUserName = (userId?: number): string => {
    if (!userId) return "—";
    const user = users[userId];
    if (!user) return "Yuklanmoqda...";
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "Noma'lum";
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString('uz-UZ', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchUserDetails = useCallback(async (userId: number): Promise<void> => {
    if (!userId || loadingUsersRef.current.has(userId) || loadedUsersRef.current.has(userId)) {
      return;
    }
    
    loadingUsersRef.current.add(userId);
    
    try {
      const response = await axios.get<User>(`${API_BASE_URL2}api/users/${userId}/`, {
        headers: { Authorization: `Bearer ${authState?.accessToken}` }
      });
      setUsers(prev => ({ ...prev, [userId]: response.data }));
      loadedUsersRef.current.add(userId);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      loadingUsersRef.current.delete(userId);
    }
  }, [authState?.accessToken]);

  const fetchArchivedPlantations = useCallback(async (): Promise<void> => {
    if (!authState?.accessToken) return;
    
    try {
      setLoading(true);
      setError(null);

      const plantationsEndpoint = `${API_BASE_URL2}api/plantations/`;

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        archived: 'true'
      });

      if ((authState.userRole === 'headof_region' || authState.userRole === 2) && authState.regionId && authState.regionId !== null && authState.regionId !== 'null') {
        params.set('region_id', authState.regionId.toString());
      } else if (filters.region !== 'All') {
        params.append('region_id', filters.region);
      }

      if (filters.district !== 'All') {
        params.append('district_id', filters.district);
      }
      if (filters.crop_type !== 'All') {
        params.append('land_type', filters.crop_type);
      }
      if (filters.farmer && filters.farmer !== 'All') {
        params.append('farmer', filters.farmer);
      }
      if (filters.plantation_id && filters.plantation_id !== 'All') {
        params.append('plantation_id', filters.plantation_id);
      }
      
      const response = await axios.get<ApiResponse<Plantation>>(`${plantationsEndpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authState.accessToken}` }
      });
      
      const plantationsData = response.data.results || [];
      const normalized = plantationsData;

      setPlantations(normalized);
      setCount(response.data.count || normalized.length);

      const userIds = new Set<number>();
      normalized.forEach(plantation => {
        if (plantation.created_by) userIds.add(plantation.created_by);
      });

      userIds.forEach(userId => fetchUserDetails(userId));

    } catch (error) {
      console.error("Error fetching archived plantations:", error);
      const axiosError = error as AxiosError;
      setError(axiosError.message || "Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  }, [authState?.userRole, authState?.regionId, authState?.accessToken, page, filters, fetchUserDetails, pageSize]);

  const handleLogout = (): void => {
    if (logout) {
      logout();
    }
    navigate("/home");
  };

  const handlePlantationClick = (plantationId: number): void => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    
    if (filters.region !== 'All') searchParams.set('region', filters.region);
    if (filters.district !== 'All') searchParams.set('district', filters.district);
    if (filters.crop_type !== 'All') searchParams.set('crop_type', filters.crop_type);
    if (filters.farmer && filters.farmer !== 'All') searchParams.set('farmer', filters.farmer);
    if (filters.plantation_id && filters.plantation_id !== 'All') searchParams.set('plantation_id', filters.plantation_id);
    
    const returnUrl = `/archived-plantations?${searchParams.toString()}`;
    
    navigate(`/plantations/${plantationId}`, { 
      state: { 
        from: returnUrl,
        filters: filters,
        page: page
      } 
    });
  };

  useEffect(() => {
    const search = location.search;
    const urlParams = new URLSearchParams(search);
    const pageFromUrl = urlParams.get('page');
    
    if (!pageFromUrl) {
      const savedPage = parseInt(localStorage.getItem('archivedPlantationsPage') || "1", 10);
      const validSavedPage = savedPage > 0 ? savedPage : 1;
      setPage(validSavedPage);
      window.history.replaceState(null, '', `/archived-plantations?page=${validSavedPage}`);
      return;
    }
    
    const pageNumber = parseInt(pageFromUrl, 10);
    
    if (pageNumber > 0) {
      setPage(pageNumber);
      localStorage.setItem('archivedPlantationsPage', pageNumber.toString());
    } else {
      setPage(1);
      localStorage.setItem('archivedPlantationsPage', '1');
      navigate('/archived-plantations?page=1', { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlPage = parseInt(urlParams.get("page") || "1", 10);
    
    if (urlPage !== page && page > 0) {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page.toString());
      
      if (filters.region !== 'All') searchParams.set('region', filters.region);
      if (filters.district !== 'All') searchParams.set('district', filters.district);
      if (filters.crop_type !== 'All') searchParams.set('crop_type', filters.crop_type);
      if (filters.farmer && filters.farmer !== 'All') searchParams.set('farmer', filters.farmer);
      if (filters.plantation_id && filters.plantation_id !== 'All') searchParams.set('plantation_id', filters.plantation_id);
      
      const newUrl = `/archived-plantations?${searchParams.toString()}`;
      navigate(newUrl, { replace: true });
      localStorage.setItem('archivedPlantationsPage', page.toString());
    }
  }, [page, filters, navigate]);

  useEffect(() => {
    const newFilters = getFiltersFromUrl();
    setFilters(prev => {
      const hasChanged = 
        prev.region !== newFilters.region ||
        prev.district !== newFilters.district ||
        prev.crop_type !== newFilters.crop_type ||
        prev.farmer !== newFilters.farmer ||
        prev.plantation_id !== newFilters.plantation_id;
      
      return hasChanged ? newFilters : prev;
    });
  }, [location.search]);

  useEffect(() => {
    if (authState?.userRole === 'headof_region' && authState?.regionId && filters.region === 'All') {
      const newFilters: Filters = {
        ...filters,
        region: authState.regionId.toString()
      };
      setFilters(newFilters);
      saveFiltersToUrl(newFilters, page);
    }
  }, [authState?.userRole, authState?.regionId, filters, page]);

  useEffect(() => {
    if (authState?.accessToken) {
      fetchArchivedPlantations();
    } else {
      navigate('/login');
    }
  }, [authState?.accessToken, navigate, fetchArchivedPlantations]);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Мобильное меню */}
      <div className="lg:hidden bg-gray-800 shadow-lg p-4 border-b border-gray-700 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              className="h-10 w-auto mr-3"
              src={uzbekistanEmblem}
              alt="O'zbekiston gerbi"
            />
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Agrosanoatni rivojlantirish agentligi
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleLogout}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs flex items-center"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              Chiqish
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        
        {isMobileMenuOpen && (
          <div className="mt-4 space-y-2">
            <Link
              to="/"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bosh sahifa
            </Link>
            <Link
              to="/plantations/uz"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Bog'larga o'tish
            </Link>
            <Link
              to="/moderation"
              className="block w-full bg-gray-700 border border-gray-600 text-white py-2 rounded-lg font-medium text-center hover:bg-gray-600 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Moderatsiya
            </Link>
            <Link
              to="/archived-plantations"
              className="block w-full bg-yellow-600 text-white py-2 rounded-lg font-medium text-center hover:bg-yellow-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Arxivlangan bog'lar
            </Link>
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="min-h-screen bg-gray-900 flex flex-col">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-white text-2xl font-bold mb-2">Arxivlangan bog'lar</h1>
        </div>
            </div>

            {/* Фильтры */}
            <div className="bg-gray-800 rounded-lg p-3 mb-4 border border-gray-700">
              <div className="flex flex-wrap items-center gap-4">
                <button
                  className="px-4 py-2 rounded-lg border border-gray-600 bg-yellow-600 text-white hover:bg-yellow-700 transition-colors text-sm font-medium"
                  onClick={handleResetFilters}
                >
                  Filterlarni tozalash
                </button>
                <input
                  type="text"
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Fermer INN yoki ID"
                  value={filters.farmer === 'All' ? '' : filters.farmer}
                  onChange={(e) => handleFilterChange('farmer', e.target.value.trim() || 'All')}
                />
                <input
                  type="text"
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder="Planatsiya ID"
                  value={filters.plantation_id === 'All' ? '' : filters.plantation_id}
                  onChange={(e) => handleFilterChange('plantation_id', e.target.value.trim() || 'All')}
                />
                
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  value={filters.region}
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  {getRegionOptions().map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                {filters.region !== "All" && (
                  <select
                    className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    value={filters.district}
                    onChange={(e) => handleFilterChange('district', e.target.value)}
                  >
                    <option value="All">Tuman (barchasi)</option>
                    {getDistrictsByRegion(filters.region).map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                )}
                
                <select
                  className="px-4 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  value={filters.crop_type}
                  onChange={(e) => handleFilterChange('crop_type', e.target.value)}
                >
                  <option value="All">Ekin turi</option>
                  <option value="Bog'lar">Bog'lar</option>
                  <option value="Issiqxonalar">Issiqxonalar</option>
                  <option value="Uzumzorlar">Uzumzorlar</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Ma'lumotlar yuklanmoqda...</p>
                </div>
              </div>
            )}

            {!loading && plantations.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {plantations.map((plantation) => (
                  <div
                    key={plantation.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => handlePlantationClick(plantation.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-white mb-1">
                          {plantation.farmer?.name || "Fermer nomi yo'q"}
                        </h3>
                        <p className="text-xs text-gray-400 mb-1">
                          {plantation.name || "Sarlavhasiz bog'"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Maydon: {plantation.total_area || 0} GA
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                          Arxivlangan
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Viloyat</div>
                        <div className="text-white font-medium">
                          {plantation.region_name 
                            ? getRegionNameById(plantation.region_name)
                            : getRegionNameById(plantation.district?.region)}
                        </div>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Tuman</div>
                        <div className="text-white font-medium">
                          {plantation.district_name || plantation.district?.name || "—"}
                        </div>
                      </div>
                      <div className="bg-gray-700/30 rounded p-2 border border-gray-600">
                        <div className="text-gray-400 mb-1">Qo'shgan</div>
                        <div className="text-white font-medium">{getUserName(plantation.created_by)}</div>
                        <div className="text-gray-500">{formatDate(plantation.created_at)}</div>
                      </div>
                      <div className="bg-yellow-700/20 rounded p-2 border border-yellow-600">
                        <div className="text-yellow-400 mb-1">Arxivlangan</div>
                        <div className="text-white font-medium text-xs">
                          {plantation.archived ? "Ha" : "Yo'q"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {count > pageSize && (
              <div className="mt-8">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-400">
                      Sahifa {page} dan {totalPages} | Jami: {count} ta arxivlangan bog'
                    </div>
                    
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        onClick={goToFirstPage}
                        disabled={page <= 1}
                        title="Birinchi sahifa"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <button
                        className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        onClick={() => {
                          const newPage = Math.max(page - 1, 1);
                          setPage(newPage);
                          saveFiltersToUrl(filters, newPage);
                        }}
                        disabled={page <= 1}
                      >
                        Orqaga
                      </button>
                      
                      <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1 sm:space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          value={pageInput}
                          onChange={handlePageInputChange}
                          className="w-12 sm:w-16 px-1 sm:px-2 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-center text-sm"
                          placeholder={page.toString()}
                        />
                        <button
                          type="submit"
                          className="px-2 sm:px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-xs sm:text-sm"
                        >
                          O'tish
                        </button>
                      </form>
                      
                      <button
                        className="px-3 sm:px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        onClick={() => {
                          const newPage = Math.min(page + 1, totalPages);
                          setPage(newPage);
                          saveFiltersToUrl(filters, newPage);
                        }}
                        disabled={page >= totalPages}
                      >
                        Oldinga
                      </button>
                      
                      <button
                        className="p-2 sm:px-3 sm:py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        onClick={goToLastPage}
                        disabled={page >= totalPages}
                        title="Oxirgi sahifa"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {plantations.length > 0 && (
              <div className="text-center mt-6">
                <p className="text-gray-400 text-sm">
                  Ko'rsatilgan: {plantations.length} ta arxivlangan bog'
                </p>
              </div>
            )}

            {!loading && plantations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Arxivlangan bog'lar topilmadi</p>
              </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ArchivedPlantations;

