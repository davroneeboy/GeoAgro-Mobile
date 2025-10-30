import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CloseButtonWithReturn({ fallback }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = () => {
    const fromState = location.state?.from;
    const referrer = document.referrer || '';

    if (fromState && typeof fromState === 'string') {
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



