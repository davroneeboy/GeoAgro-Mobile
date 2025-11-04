import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CloseButtonWithReturn({ fallback }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    const fromState = location.state?.from;
    const referrer = document.referrer || '';

    if (fromState && typeof fromState === 'string') {
      // Если fromState уже содержит полный URL с параметрами, используем его напрямую
      if (fromState.includes('?')) {
        navigate(fromState);
        return;
      }
      // Если fromState - это просто путь, но есть сохранённые фильтры
      const savedFilters = location.state?.filters;
      const savedPage = location.state?.page;
      if (savedFilters && fromState.includes('/approved-plantations')) {
        const searchParams = new URLSearchParams();
        const pageToUse = savedPage || localStorage.getItem('approvedPlantationsPage') || 1;
        searchParams.set('page', pageToUse.toString());
        
        if (savedFilters.region !== 'All') searchParams.set('region', savedFilters.region);
        if (savedFilters.district !== 'All') searchParams.set('district', savedFilters.district);
        if (savedFilters.farmer && savedFilters.farmer !== 'All') searchParams.set('farmer', savedFilters.farmer);
        if (savedFilters.plantation_id && savedFilters.plantation_id !== 'All') searchParams.set('plantation_id', savedFilters.plantation_id);
        
        navigate(`/approved-plantations?${searchParams.toString()}`);
        return;
      }
      navigate(fromState);
      return;
    }

    if (referrer.includes('/approved-plantations')) {
      const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
      navigate(`/approved-plantations?page=${currentPage}`);
      return;
    }

    if (referrer.includes('/moderation')) {
      const currentPage = localStorage.getItem('moderationPage') || 1;
      navigate(`/moderation?page=${currentPage}`);
      return;
    }

    if (referrer.includes('/rejected-plantations')) {
      const currentPage = localStorage.getItem('rejectedPlantationsPage') || 1;
      navigate(`/rejected-plantations?page=${currentPage}`);
      return;
    }

    if (referrer.includes('/plantations/uz')) {
      navigate('/plantations/uz');
      return;
    }

    if (referrer.includes('/farmers/') && referrer.includes('/map')) {
      try {
        const url = new URL(referrer);
        navigate(url.pathname);
        return;
      } catch (_) { /* fallthrough */ }
    }

    if (fallback && typeof fallback === 'string') {
      navigate(fallback);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors z-10"
      onClick={handleClose}
      title="Закрыть"
    >
      ✕
    </button>
  );
}



