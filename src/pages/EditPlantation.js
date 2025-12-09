import React, { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { GOOGLE_API_KEY } from "../config";
import { apiRequest } from "../utils/apiUtils";
import usePlantationHistory from "../hooks/usePlantationHistory";
import PlantationHistory from "../components/common/PlantationHistory";
import PlantationMetaCards from "../components/common/PlantationMetaCards";
import { fetchFarmerPlantations } from "../api/api";
import {
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
import translateAction from "../utils/moderationUtils";
import PlantationStatusIndicator from "../components/PlantationStatusIndicator";
import ModerationComments from "../components/common/ModerationComments";
import UserComments from "../components/common/UserComments";
import CloseButtonWithReturn from "../components/common/CloseButtonWithReturn";
import FruitAreasList from "../components/common/FruitAreasList";
import InefficientAreasList from "../components/common/InefficientAreasList";
/* global google */

const EditPlantation = () => {
  const { id } = useParams();
  const location = useLocation();

  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polygonAreaHectares, setPolygonAreaHectares] = useState(null);
  

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [moderationItems, setModerationItems] = useState([]);
  const { authState, refreshAccessToken } = useContext(AuthContext);
  const canDeleteComments = authState?.userRole === 'superuser';
  
  // Logs via hook
  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
    action: logsActionFilter,
    setAction: setLogsActionFilter,
    page: logsPage,
    setPage: setLogsPage,
    pageSize: logsPageSize,
    refetch: refetchLogs,
  } = usePlantationHistory(id, { initialAction: "", pageSize: 50 });
  
  // Перевод действий через общий util translateAction
  
  // Права доступа для удаления
  const canDeletePlantation = () => {
    if (authState?.userRole === 'superuser') return true;
    if (authState?.userRole === 'headof_region' && plantation?.district?.region === parseInt(authState.regionId)) return true;
    if (authState?.userRole === 'user' && plantation?.created_by === authState.userId) return true;
    return false;
  };
  // Approve confirmation modal
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const openApproveModal = () => setIsApproveModalOpen(true);
  const closeApproveModal = () => setIsApproveModalOpen(false);
  // Confirm deletion modal state for moderation comments
  const [isCommentDeleteOpen, setIsCommentDeleteOpen] = useState(false);
  const [pendingCommentId, setPendingCommentId] = useState(null);
  const openCommentDeleteModal = (commentId) => { setPendingCommentId(commentId); setIsCommentDeleteOpen(true); };
  const closeCommentDeleteModal = () => { setIsCommentDeleteOpen(false); setPendingCommentId(null); };
  const confirmDeleteModerationComment = async () => {
    if (!pendingCommentId) return;
    try {
      await apiRequest(`api/comments/${pendingCommentId}`, { method: 'DELETE' }, refreshAccessToken, authState.accessToken);
      setPlantation((prev) => {
        if (!prev) return prev;
        const nextComments = Array.isArray(prev.moderation_comment)
          ? prev.moderation_comment.filter((c) => String(c?.id) !== String(pendingCommentId))
          : prev.moderation_comment;
        return { ...prev, moderation_comment: nextComments };
      });
    } catch (e) {
      console.error('Failed to delete moderation comment', e);
    } finally {
      closeCommentDeleteModal();
    }
  };
  const [expandedSections, setExpandedSections] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [createdByUser, setCreatedByUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [regionPolygons, setRegionPolygons] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [regionLabels, setRegionLabels] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const [farmerPlantsOpen, setFarmerPlantsOpen] = useState(false);
  const [farmerPlants, setFarmerPlants] = useState([]);
  const [farmerPlantsLoading, setFarmerPlantsLoading] = useState(false);
  const [farmerPlantsError, setFarmerPlantsError] = useState(null);
  const fileInputsRef = useRef([]);
  const mapInstanceRef = useRef(null);
  const polygonRef = useRef(null);
  const mapInitializedRef = useRef(false);

  const DEFAULT_REJECT_REASONS = [
    "Investitsiya summasi noto'g'ri",
    "Fotosurat yo'q yoki sifatsiz",
    "Bog' maydoni fotosurati to'liq olinmagan",
    "Umumiy maydon gektari bo'sh maydon gektari bilan bir xil",
    "Mevali maydon turi kiritilmagan",
    "Ekin maydoni gektari noto'g'ri",
    "Chegara yonidagi fermer bilan ustma-ust tushgan",
    "Chegara noto'g'ri chizilgan",
    "Umumiy maydon bilan chizilgan maydon gektari bir xil emas",
    "Bosh maydon to'g'ri kiriting",
    "Kontur raqami kiritilmagan",
  ];
  const [selectedReasons, setSelectedReasons] = useState([]);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  // dragActive visual state removed; handlers keep preventing default
  const [focusedIdx, setFocusedIdx] = useState(null);

  const validateImageFile = (file) => {
    if (!file) return "Fayl topilmadi";
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Rasm formati noto'g'ri. JPG, PNG yoki WEBP tanlang.";
    if (file.size > MAX_IMAGE_SIZE) return "Rasm hajmi 10MB dan oshmasligi kerak.";
    return null;
  };

  const addImageFile = (file, source = 'paste', targetIndex = null) => {
    const err = validateImageFile(file);
    if (err) { setError(err); return; }
    const next = [...moderationItems];
    const preview = URL.createObjectURL(file);
    // Если известен целевой блок — вставляем в него; иначе используем последний блок; если блоков нет — создаём первый
    let idx = (typeof targetIndex === 'number' && targetIndex >= 0) ? targetIndex : (next.length > 0 ? next.length - 1 : -1);
    if (idx === -1) {
      next.push({ text: '', image: file, preview });
      idx = next.length - 1;
    } else {
      // освободим предыдущий preview
      try { if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview); } catch {}
      next[idx] = { ...(next[idx] || { text: '' }), image: file, preview };
    }
    setFocusedIdx(idx);
    setModerationItems(next);
    try { /* debug removed */ } catch {}
  };

  const handlePasteImage = (e) => {
    try {
      const items = e.clipboardData?.items || [];
      for (let i = 0; i < items.length; i += 1) {
        const it = items[i];
        if (it && it.kind === 'file' && it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            addImageFile(file, 'paste', focusedIdx);
            break;
          }
        }
      }
    } catch {}
  };

  // dragActive visual state removed; handlers keep preventing default
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDragEnter = (e) => { e.preventDefault(); };
  const handleDragLeave = (e) => { e.preventDefault(); };
  const handleDropFiles = (e) => {
    e.preventDefault();
    try {
      const files = Array.from(e.dataTransfer?.files || []);
      const img = files.find(f => ALLOWED_IMAGE_TYPES.has(f.type));
      if (img) addImageFile(img, 'drop', focusedIdx);
      else if (files.length) setError("Rasm formati noto'g'ri. JPG, PNG yoki WEBP tanlang.");
    } catch {}
  };

  // Функция для открытия модального окна
  const openModal = () => {
    setIsModalOpen(true);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Функция для закрытия модального окна
  const closeModal = () => {
    setIsModalOpen(false);
    setCustomReason("");
    try {
      moderationItems.forEach((it) => { if (it?.preview) { try { URL.revokeObjectURL(it.preview); } catch(_) {} } });
    } catch(_) {}
    setModerationItems([]);
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);
  


  const openFarmerPlantsModal = async () => {
    if (!plantation?.farmer?.id && !plantation?.farmer?.inn) return;
    try {
      setFarmerPlantsOpen(true);
      setFarmerPlantsLoading(true);
      setFarmerPlantsError(null);
      const inn = (plantation?.farmer?.inn && String(plantation.farmer.inn).trim() !== '' && Number(plantation.farmer.inn) > 0) ? plantation.farmer.inn : undefined;
      const list = await fetchFarmerPlantations({ farmer_id: plantation?.farmer?.id, farmer_inn: inn }, authState.accessToken);
      setFarmerPlants(Array.isArray(list) ? list : []);
    } catch (e) {
      setFarmerPlantsError(e?.message || 'Xatolik');
    } finally {
      setFarmerPlantsLoading(false);
    }
  };

  useEffect(() => {
    if (!isDeleteModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeDeleteModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDeleteModalOpen]);


  // Горячие клавиши для модерации
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Игнорируем если фокус в поле ввода
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Ctrl+Enter - Открыть модальное окно подтверждения
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!isDeleted) openApproveModal();
      }
      
      // Alt+Q - Открыть модальное окно отклонения
      if (e.altKey && e.key === 'q') {
        e.preventDefault();
        if (!isDeleted) openModal();
      }
      
      // Esc - Закрыть любое модальное окно
      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
        if (isApproveModalOpen) closeApproveModal();
        if (isDeleteModalOpen) closeDeleteModal();
        if (isCommentDeleteOpen) closeCommentDeleteModal();
        if (farmerPlantsOpen) setFarmerPlantsOpen(false);
        if (selectedImage) setSelectedImage(null);
      }
      
      // Alt+1-9 - Выбрать/снять причину отклонения по номеру
      if (e.altKey && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < DEFAULT_REJECT_REASONS.length) {
          const reason = DEFAULT_REJECT_REASONS[idx];
          setSelectedReasons(prev => 
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
          );
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isModalOpen, isApproveModalOpen, isDeleteModalOpen, isCommentDeleteOpen, isDeleted, selectedReasons, farmerPlantsOpen, selectedImage]);

  const handleConfirm = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Текст может прийти из: основного поля, любого пункта, либо из выбранных причин
      const userText = String(customReason || '').trim();
      const itemTexts = (moderationItems || []).map(i => String(i.text || '').trim()).filter(Boolean);
      const reasonsJoined = (selectedReasons || []).join('\n').trim();
      if (!reasonsJoined && itemTexts.length === 0 && !userText) {
        setError("Iltimos, rad etish sababini kiriting!");
        return;
      }
      // Собираем список отдельных отправок: сначала пользовательский текст, затем пункты с файлами, затем выбранные причины
      const itemsToSend = [];
      if (userText) itemsToSend.push({ text: userText, image: null });
      (moderationItems || []).forEach((it) => {
        const t = String(it.text || '').trim();
        if (t) itemsToSend.push({ text: t, image: (it.image instanceof File) ? it.image : null });
      });
      (selectedReasons || []).forEach((r) => {
        const t = String(r || '').trim();
        if (t) itemsToSend.push({ text: t, image: null });
      });
      // Удаляем дубли по тексту, сохраняем первый встреченный (с его файлом)
      const seen = new Set();
      const unique = [];
      for (const it of itemsToSend) {
        const key = it.text.toLowerCase();
        if (!seen.has(key)) { seen.add(key); unique.push(it); }
      }
      if (unique.length === 0) {
        setError("Iltimos, rad etish sababini kiriting!");
        return;
      }
      
      
      // Последовательно отправляем по одному, чтобы бэк добавлял комментарии
      for (let idx = 0; idx < unique.length; idx += 1) {
        const { text, image } = unique[idx];
        if (image) {
          if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
            setError("Rasm formati noto'g'ri. JPG, PNG yoki WEBP tanlang.");
            return;
          }
          if (image.size > MAX_IMAGE_SIZE) {
            setError("Rasm hajmi 10MB dan oshmasligi kerak.");
            return;
          }
        }
        const fd = new FormData();
        fd.append('moderation_comment', text);
        if (image) {
          try { fd.append('moderation_image', image, image.name); } catch { fd.append('moderation_image', image); }
        }
        
        try {
          const dbg = [];
          for (const [k, v] of fd.entries()) { dbg.push([k, (v && v.name) ? v.name : v]); }
          
        } catch {}
      await apiRequest(`api/plantations/${plantation.id}/reject/`, {
          method: 'POST',
          body: fd,
      }, refreshAccessToken, authState.accessToken);
        try { /* debug removed */ } catch {}
      }

      
      setSuccessMessage("Rad etish sabab(lar)i qo'shildi");
      closeModal();
      // Redirect back to moderation/list after short delay
      setTimeout(() => {
        
        // Иначе возвращаемся в модерацию
        const fromPage = location.state?.from;
        const savedFilters = location.state?.filters;
        const savedPage = location.state?.page;
        if (fromPage && fromPage.includes('/approved-plantations')) {
          const searchParams = new URLSearchParams();
          const pageToUse = savedPage || localStorage.getItem('approvedPlantationsPage') || 1;
          searchParams.set('page', pageToUse.toString());
          
          if (savedFilters) {
            if (savedFilters.region !== 'All') searchParams.set('region', savedFilters.region);
            if (savedFilters.district !== 'All') searchParams.set('district', savedFilters.district);
            if (savedFilters.farmer && savedFilters.farmer !== 'All') searchParams.set('farmer', savedFilters.farmer);
            if (savedFilters.plantation_id && savedFilters.plantation_id !== 'All') searchParams.set('plantation_id', savedFilters.plantation_id);
          }
          
          window.location.href = `/approved-plantations?${searchParams.toString()}`;
        } else if (fromPage === '/rejected-plantations') {
          window.location.href = '/rejected-plantations';
        } else if (fromPage === '/deletion-requests') {
          const currentPage = location.state?.page || 1;
          window.location.href = `/deletion-requests?page=${currentPage}`;
        } else if (fromPage && fromPage.includes('/farmers/') && fromPage.includes('/map')) {
          // Возвращаемся на карту плантаций фермера
          window.location.href = fromPage;
        } else if (fromPage === '/moderation') {
          const currentPage = localStorage.getItem('moderationPage') || 1;
          const savedFilters = location.state?.filters;
          const searchParams = new URLSearchParams();
          searchParams.set('page', currentPage.toString());
          if (savedFilters) {
            if (savedFilters.action && savedFilters.action !== 'All') searchParams.set('action', savedFilters.action);
            if (savedFilters.status && savedFilters.status !== 'All') searchParams.set('status', savedFilters.status);
            if (savedFilters.type && savedFilters.type !== 'All') searchParams.set('type', savedFilters.type);
            if (savedFilters.region && savedFilters.region !== 'All') searchParams.set('region', savedFilters.region);
            if (savedFilters.district && savedFilters.district !== 'All') searchParams.set('district', savedFilters.district);
            if (savedFilters.farmer && savedFilters.farmer !== 'All') searchParams.set('farmer', savedFilters.farmer);
            // новые фильтры
            if (savedFilters.farmer_id && savedFilters.farmer_id !== 'All') searchParams.set('farmer_id', savedFilters.farmer_id);
            if (savedFilters.min_area && savedFilters.min_area !== 'All') searchParams.set('min_area', savedFilters.min_area);
            if (savedFilters.max_area && savedFilters.max_area !== 'All') searchParams.set('max_area', savedFilters.max_area);
            if (savedFilters.min_fertility_score && savedFilters.min_fertility_score !== 'All') searchParams.set('min_fertility_score', savedFilters.min_fertility_score);
            if (savedFilters.max_fertility_score && savedFilters.max_fertility_score !== 'All') searchParams.set('max_fertility_score', savedFilters.max_fertility_score);
            if (savedFilters.min_irrigation_area && savedFilters.min_irrigation_area !== 'All') searchParams.set('min_irrigation_area', savedFilters.min_irrigation_area);
            if (savedFilters.max_irrigation_area && savedFilters.max_irrigation_area !== 'All') searchParams.set('max_irrigation_area', savedFilters.max_irrigation_area);
            if (savedFilters.is_fertile && savedFilters.is_fertile !== 'All') searchParams.set('is_fertile', savedFilters.is_fertile);
            if (savedFilters.is_checked && savedFilters.is_checked !== 'All') searchParams.set('is_checked', savedFilters.is_checked);
            if (savedFilters.is_rejected && savedFilters.is_rejected !== 'All') searchParams.set('is_rejected', savedFilters.is_rejected);
            if (savedFilters.is_deleting && savedFilters.is_deleting !== 'All') searchParams.set('is_deleting', savedFilters.is_deleting);
            if (savedFilters.land_type && savedFilters.land_type !== 'All') searchParams.set('land_type', savedFilters.land_type);
            if (savedFilters.created_after && savedFilters.created_after !== 'All') searchParams.set('created_after', savedFilters.created_after);
            if (savedFilters.created_before && savedFilters.created_before !== 'All') searchParams.set('created_before', savedFilters.created_before);
            if (savedFilters.moderated_after && savedFilters.moderated_after !== 'All') searchParams.set('moderated_after', savedFilters.moderated_after);
            if (savedFilters.moderated_before && savedFilters.moderated_before !== 'All') searchParams.set('moderated_before', savedFilters.moderated_before);
            if (savedFilters.garden_established_year && savedFilters.garden_established_year !== 'All') searchParams.set('garden_established_year', savedFilters.garden_established_year);
            if (savedFilters.min_established_year && savedFilters.min_established_year !== 'All') searchParams.set('min_established_year', savedFilters.min_established_year);
            if (savedFilters.max_established_year && savedFilters.max_established_year !== 'All') searchParams.set('max_established_year', savedFilters.max_established_year);
            if (savedFilters.created_by && savedFilters.created_by !== 'All') searchParams.set('created_by', savedFilters.created_by);
            if (savedFilters.created_by_username && savedFilters.created_by_username !== 'All') searchParams.set('created_by_username', savedFilters.created_by_username);
            if (savedFilters.moderated_by && savedFilters.moderated_by !== 'All') searchParams.set('moderated_by', savedFilters.moderated_by);
            if (savedFilters.moderated_by_username && savedFilters.moderated_by_username !== 'All') searchParams.set('moderated_by_username', savedFilters.moderated_by_username);
            if (savedFilters.has_moderation_comment && savedFilters.has_moderation_comment !== 'All') searchParams.set('has_moderation_comment', savedFilters.has_moderation_comment);
            if (savedFilters.sort_by) searchParams.set('sort_by', savedFilters.sort_by);
            if (savedFilters.sort_order) searchParams.set('sort_order', savedFilters.sort_order);
          }
          const newUrl = `/moderation?${searchParams.toString()}`;
          window.location.href = newUrl;
        } else {
          // fallback: go back one step
          window.history.back();
        }
      }, 600);
    } catch (error) {
      console.error("Error rejecting plantation:", error);
      let message = "Plantatsiyani rad etishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
       try {
         if (error?.response?.data) {
           const data = error.response.data;
           if (typeof data === 'string') message = data;
           else if (data?.detail) message = String(data.detail);
           else if (data?.error) message = String(data.error);
         }
         const status = error?.response?.status;
         if (status === 401) message = "Avtorizatsiya talab qilinadi (401)";
         else if (status === 403) message = "Ruxsat yo'q (403)";
         else if (status === 404) message = "Plantatsiya topilmadi (404)";
         else if (status === 400) message = message || "So'rov noto'g'ri (400)";
         
       } catch {}
       setError(message);
    }
  };


  const handleDeleteConfirm = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      await apiRequest(`api/plantations/${id}/`, {
        method: "DELETE",
      }, refreshAccessToken, authState.accessToken);

      setIsDeleted(true);
      closeDeleteModal();


      // Перенаправляем обратно на страницу модерации/списков с восстановлением фильтров
      const fromPage = location.state?.from;
      const savedFilters = location.state?.filters;
      const savedPage = location.state?.page;
      if (fromPage && fromPage.includes('/approved-plantations')) {
        const searchParams = new URLSearchParams();
        const pageToUse = savedPage || localStorage.getItem('approvedPlantationsPage') || 1;
        searchParams.set('page', pageToUse.toString());
        
        if (savedFilters) {
          if (savedFilters.region !== 'All') searchParams.set('region', savedFilters.region);
          if (savedFilters.district !== 'All') searchParams.set('district', savedFilters.district);
          if (savedFilters.farmer && savedFilters.farmer !== 'All') searchParams.set('farmer', savedFilters.farmer);
          if (savedFilters.plantation_id && savedFilters.plantation_id !== 'All') searchParams.set('plantation_id', savedFilters.plantation_id);
        }
        
        window.location.href = `/approved-plantations?${searchParams.toString()}`;
      } else if (fromPage === '/rejected-plantations') {
        window.location.href = '/rejected-plantations';
      } else if (fromPage === '/deletion-requests') {
        const currentPage = location.state?.page || 1;
        window.location.href = `/deletion-requests?page=${currentPage}`;
      } else if (fromPage && fromPage.includes('/farmers/') && fromPage.includes('/map')) {
        // Возвращаемся на карту плантаций фермера
        window.location.href = fromPage;
      } else {
        const currentPage = localStorage.getItem('moderationPage') || 1;
        const savedFilters = location.state?.filters;
        const searchParams = new URLSearchParams();
        searchParams.set('page', currentPage.toString());
        if (savedFilters) {
          if (savedFilters.action && savedFilters.action !== 'All') searchParams.set('action', savedFilters.action);
          if (savedFilters.status && savedFilters.status !== 'All') searchParams.set('status', savedFilters.status);
          if (savedFilters.type && savedFilters.type !== 'All') searchParams.set('type', savedFilters.type);
          if (savedFilters.region && savedFilters.region !== 'All') searchParams.set('region', savedFilters.region);
          if (savedFilters.district && savedFilters.district !== 'All') searchParams.set('district', savedFilters.district);
          if (savedFilters.farmer && savedFilters.farmer !== 'All') searchParams.set('farmer', savedFilters.farmer);
          // новые фильтры
          if (savedFilters.farmer_id && savedFilters.farmer_id !== 'All') searchParams.set('farmer_id', savedFilters.farmer_id);
          if (savedFilters.min_area && savedFilters.min_area !== 'All') searchParams.set('min_area', savedFilters.min_area);
          if (savedFilters.max_area && savedFilters.max_area !== 'All') searchParams.set('max_area', savedFilters.max_area);
          if (savedFilters.min_fertility_score && savedFilters.min_fertility_score !== 'All') searchParams.set('min_fertility_score', savedFilters.min_fertility_score);
          if (savedFilters.max_fertility_score && savedFilters.max_fertility_score !== 'All') searchParams.set('max_fertility_score', savedFilters.max_fertility_score);
          if (savedFilters.min_irrigation_area && savedFilters.min_irrigation_area !== 'All') searchParams.set('min_irrigation_area', savedFilters.min_irrigation_area);
          if (savedFilters.max_irrigation_area && savedFilters.max_irrigation_area !== 'All') searchParams.set('max_irrigation_area', savedFilters.max_irrigation_area);          if (savedFilters.is_fertile && savedFilters.is_fertile !== 'All') searchParams.set('is_fertile', savedFilters.is_fertile);
          if (savedFilters.is_checked && savedFilters.is_checked !== 'All') searchParams.set('is_checked', savedFilters.is_checked);
          if (savedFilters.is_rejected && savedFilters.is_rejected !== 'All') searchParams.set('is_rejected', savedFilters.is_rejected);
          if (savedFilters.is_deleting && savedFilters.is_deleting !== 'All') searchParams.set('is_deleting', savedFilters.is_deleting);
          if (savedFilters.land_type && savedFilters.land_type !== 'All') searchParams.set('land_type', savedFilters.land_type);
          if (savedFilters.created_after && savedFilters.created_after !== 'All') searchParams.set('created_after', savedFilters.created_after);
          if (savedFilters.created_before && savedFilters.created_before !== 'All') searchParams.set('created_before', savedFilters.created_before);
          if (savedFilters.moderated_after && savedFilters.moderated_after !== 'All') searchParams.set('moderated_after', savedFilters.moderated_after);
          if (savedFilters.moderated_before && savedFilters.moderated_before !== 'All') searchParams.set('moderated_before', savedFilters.moderated_before);
          if (savedFilters.garden_established_year && savedFilters.garden_established_year !== 'All') searchParams.set('garden_established_year', savedFilters.garden_established_year);
          if (savedFilters.min_established_year && savedFilters.min_established_year !== 'All') searchParams.set('min_established_year', savedFilters.min_established_year);
          if (savedFilters.max_established_year && savedFilters.max_established_year !== 'All') searchParams.set('max_established_year', savedFilters.max_established_year);
          if (savedFilters.created_by && savedFilters.created_by !== 'All') searchParams.set('created_by', savedFilters.created_by);
          if (savedFilters.created_by_username && savedFilters.created_by_username !== 'All') searchParams.set('created_by_username', savedFilters.created_by_username);
          if (savedFilters.moderated_by && savedFilters.moderated_by !== 'All') searchParams.set('moderated_by', savedFilters.moderated_by);
          if (savedFilters.moderated_by_username && savedFilters.moderated_by_username !== 'All') searchParams.set('moderated_by_username', savedFilters.moderated_by_username);
          if (savedFilters.has_moderation_comment && savedFilters.has_moderation_comment !== 'All') searchParams.set('has_moderation_comment', savedFilters.has_moderation_comment);
          if (savedFilters.sort_by) searchParams.set('sort_by', savedFilters.sort_by);
          if (savedFilters.sort_order) searchParams.set('sort_order', savedFilters.sort_order);
        }
        const newUrl = `/moderation?${searchParams.toString()}`;
        window.location.href = newUrl;
      }
    } catch (e) {
      console.error("Error deleting plantation:", e);
      setError("Plantatsiyani o'chirishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  };

  // Функция для получения информации о пользователе
  const fetchUserDetails = useCallback(async (userId) => {
    if (!userId) return null;
    
    try {
      // Получаем список всех пользователей
      const users = await apiRequest('api/users/', {}, refreshAccessToken, authState.accessToken);
      
      // Находим пользователя по ID
      const user = users.find(u => u.id === parseInt(userId));
      return user;
    } catch (error) {
      console.error("Error fetching user details:", error);
      // RBAC: Для ошибок доступа не показываем ошибку пользователю
      if (error.response?.status === 404 || error.response?.status === 403) {
      
      }
      return null;
    }
  }, [authState.accessToken, refreshAccessToken]);

  const fetchPlantationDetails = useCallback(async () => {
    try {
      setError(null);
      const data = await apiRequest(`api/plantations/${id}/`, {}, refreshAccessToken, authState.accessToken);
      
      // Нормализация массивов и фолбэки ключей
      const normalized = {
        ...data,
        trellises: Array.isArray(data.trellises) ? data.trellises : (Array.isArray(data.trellis_list) ? data.trellis_list : []),
        reservoirs: Array.isArray(data.reservoirs) ? data.reservoirs : (Array.isArray(data.reservoir_list) ? data.reservoir_list : []),
      };

      // Подсчет reservoir_count, если отсутствует
      if (normalized.reservoir_count == null) {
        normalized.reservoir_count = Array.isArray(normalized.reservoirs) ? normalized.reservoirs.length : 0;
      }

      setPlantation(normalized);
      
      // Получаем информацию о пользователе, который создал плантацию
      if (normalized.created_by) {
        const userDetails = await fetchUserDetails(normalized.created_by);
        setCreatedByUser(userDetails);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching plantation details:", error);
      
      
      // RBAC: Проверяем, является ли ошибка связанной с доступом
      if (error.response?.status === 404 || error.response?.status === 403) {
        
        setError("ACCESS_DENIED");
      } else {
        
      setError("Ma'lumotlarni yuklashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
      }
      
      setLoading(false);
    }
  }, [id, authState.accessToken, refreshAccessToken, fetchUserDetails]);







  // Функция для добавления обработчиков событий к полигону
  const addPolygonEventListeners = (polygon, districtName, mapInstance) => {
    // Создаем элемент для отображения названия в углу
    let cornerLabel = null;
    
    // Добавляем обработчики событий для полигона
    polygon.addListener('mouseover', function() {
      // Удаляем предыдущую подпись если есть
      if (cornerLabel && cornerLabel.parentNode) {
        cornerLabel.parentNode.removeChild(cornerLabel);
      }
      
      // Создаем новую подпись в правом верхнем углу
      cornerLabel = document.createElement("div");
      cornerLabel.style.position = "absolute";
      cornerLabel.style.top = "20px";
      cornerLabel.style.right = "20px";
      cornerLabel.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
      cornerLabel.style.color = "white";
      cornerLabel.style.padding = "8px 16px";
      cornerLabel.style.borderRadius = "8px";
      cornerLabel.style.fontWeight = "bold";
      cornerLabel.style.fontSize = "18px";
      cornerLabel.style.zIndex = "1000";
      cornerLabel.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
      cornerLabel.style.border = "2px solid #FFD700";
      cornerLabel.style.minWidth = "120px";
      cornerLabel.style.textAlign = "center";
      cornerLabel.innerHTML = districtName;
      
      // Добавляем в контейнер карты
      const mapContainer = mapInstance.getDiv();
      mapContainer.appendChild(cornerLabel);
    });

    polygon.addListener('mouseout', function() {
      // Удаляем подпись при уходе курсора
      if (cornerLabel && cornerLabel.parentNode) {
        cornerLabel.parentNode.removeChild(cornerLabel);
        cornerLabel = null;
      }
    });
  };

  // Функция для загрузки полигонов всех регионов
  const loadRegionPolygons = async (mapInstance) => {
    try {
      // Очищаем старые полигоны
      setRegionPolygons(prev => {
        prev.forEach((polygon) => {
          polygon.setMap(null);
        });
        return [];
      });
      setRegionLabels(prev => {
        prev.forEach(({ overlay }) => overlay.setMap(null));
        return [];
      });
      
      // Список всех регионов
      const regions = [
        'toshkent', 'navoiy', 'jizzax', 'namangan', 'andijon', 'fargona',
        'samarqand', 'buxoro', 'qashqadaryo', 'surxondaryo', 'qoraqalpogiston',
        'xorazm', 'sirdaryo'
      ];
      
      const newPolygons = [];
      const newLabels = [];
      
      // Загружаем все регионы параллельно
      const regionPromises = regions.map(async (regionName) => {
        try {
          const response = await fetch(`/uzb-geojson/${regionName}.geojson`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const geojson = await response.json();
          
          geojson.features.forEach((feature, index) => {
            let paths = [];
            
            // Проверяем наличие геометрии
            if (!feature.geometry || !feature.geometry.coordinates) {
              return;
            }
            
            // Обрабатываем разные типы геометрии
            if (feature.geometry.type === 'Polygon') {
              paths = feature.geometry.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
              
                          if (paths.length === 0) {
              return;
            }
              
              // Проверяем наличие названия района
              const districtName = feature.properties?.name || feature.properties?.NAME || `District ${index}`;
              
              // Создаем полигон района
              const polygon = new google.maps.Polygon({
                paths,
                strokeColor: "#FFD700",
                strokeOpacity: 1,
                strokeWeight: 3,
                fillOpacity: 0,
                map: mapInstance,
                clickable: true,
                zIndex: 1,
              });
              
              // Добавляем обработчики событий для полигона
              addPolygonEventListeners(polygon, districtName, mapInstance);
              
              newPolygons.push(polygon);
              
            } else if (feature.geometry.type === 'MultiPolygon') {
              // Для MultiPolygon создаем полигон для каждой части
              const districtName = feature.properties?.name || feature.properties?.NAME || `District ${index}`;
              
              feature.geometry.coordinates.forEach((polygonCoords, polygonIndex) => {
                polygonCoords.forEach((ringCoords, ringIndex) => {
                  const paths = ringCoords.map(([lng, lat]) => ({ lat, lng }));
                  
                  if (paths.length === 0) {
                    return;
                  }
                  
                  // Создаем полигон для этой части
                  const polygon = new google.maps.Polygon({
                    paths,
                    strokeColor: "#FFD700",
                    strokeOpacity: 1,
                    strokeWeight: 3,
                    fillOpacity: 0,
                    map: mapInstance,
                    clickable: true,
                    zIndex: 1,
                  });
                  
                  // Добавляем обработчики событий для полигона
                  addPolygonEventListeners(polygon, districtName, mapInstance);
                  
                  newPolygons.push(polygon);
                });
              });
              
            } else {
              return;
            }
          });
        } catch (error) {
          console.error(`Ошибка загрузки региона ${regionName}:`, error);
        }
      });
      
      // Ждем загрузки всех регионов
      await Promise.all(regionPromises);
      
      setRegionPolygons(newPolygons);
      setRegionLabels(newLabels);
    } catch (error) {
      console.error("Ошибка загрузки полигонов районов:", error);
    }
  };

  // Локальный помощник для названия региона по ID (включая 13: Xorazm)
  const getRegionNameById = (regionId) => {
    const regionNames = {
      1: "Toshkent",
      2: "Andijon",
      3: "Buxoro",
      4: "Farg'ona",
      5: "Jizzax",
      6: "Qashqadaryo",
      7: "Navoiy",
      8: "Namangan",
      9: "Samarqand",
      10: "Sirdaryo",
      11: "Surxondaryo",
      12: "Qoraqalpog'iston",
      13: "Xorazm",
    };
    return regionNames[regionId] || `Region ${regionId}`;
  };

  const initializeMap = () => {
    // Проверяем, что карта еще не создана
    if (mapInitializedRef.current || !plantation || !plantation.coordinates) {
      return;
    }

    const mapElement = document.getElementById("map");
    if (!mapElement) {
      return;
    }

    const map = new google.maps.Map(mapElement, {
      center: { lat: 41.2995, lng: 69.2401 },
      zoom: 12,
      mapTypeId: "satellite",
      disableDefaultUI: true,
    });

    mapInstanceRef.current = map;
    mapInitializedRef.current = true;

      const paths = plantation.coordinates.map((coord) => ({
        lat: coord.latitude,
        lng: coord.longitude,
      }));

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: "#FF0000",
        strokeOpacity: 1,
        strokeWeight: 2,
        fillColor: "#FF0000",
        fillOpacity: 0.35,
        map,
        editable: true,
        draggable: false,
      zIndex: 2,
    });

    polygonRef.current = polygon;

    // Добавляем такой же hover-лейбл в правом верхнем углу и для основной плантации
    const mainLabelText = `${getRegionNameById(plantation?.district?.region)}, ${plantation?.district?.name || ""}`;
    addPolygonEventListeners(polygon, mainLabelText, map);

    // Создание информационной панели с площадью на карте
    const areaOverlay = document.createElement("div");
    areaOverlay.style.position = "absolute";
    areaOverlay.style.top = "10px";
    areaOverlay.style.left = "10px";
    areaOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    areaOverlay.style.color = "white";
    areaOverlay.style.padding = "10px 16px";
    areaOverlay.style.borderRadius = "8px";
    areaOverlay.style.fontWeight = "600";
    areaOverlay.style.fontSize = "15px";
    areaOverlay.style.zIndex = "1000";
    areaOverlay.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    areaOverlay.style.border = "2px solid #FF6B6B";

    const mapContainer = map.getDiv();
    mapContainer.appendChild(areaOverlay);

    // Функция для обновления площади
    const updateAreaDisplay = () => {
      const areaInSquareMeters = google.maps.geometry.spherical.computeArea(polygon.getPath());
      const areaInHectares = areaInSquareMeters / 10000;
      setPolygonAreaHectares(areaInHectares);
      areaOverlay.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF6B6B">
            <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v8H8V8z"/>
          </svg>
          <span>Maydon: <strong>${areaInHectares.toFixed(2)} GA</strong></span>
        </div>
      `;
    };

    // Начальный расчет площади
    updateAreaDisplay();

      const updateCoordinates = () => {
        const newPaths = polygon.getPath();
        const newCoordinates = [];
        for (let i = 0; i < newPaths.getLength(); i++) {
          const vertex = newPaths.getAt(i);
          newCoordinates.push({
            latitude: vertex.lat(),
            longitude: vertex.lng(),
          });
        }
        setPlantation((prev) => ({
          ...prev,
          coordinates: newCoordinates,
        }));
      // Обновляем площадь при изменении координат
      updateAreaDisplay();
      };

      polygon.addListener("mouseup", updateCoordinates);
    polygon.addListener("set_at", updateAreaDisplay);
    polygon.addListener("insert_at", updateAreaDisplay);
    polygon.addListener("remove_at", updateAreaDisplay);

    // Устанавливаем границы для отображения полигона только при первой инициализации
      const bounds = new google.maps.LatLngBounds();
      paths.forEach((coord) => bounds.extend(coord));
      map.fitBounds(bounds);

      // Сначала загружаем полигоны всех регионов (не кликабельные, подложка)
    loadRegionPolygons(map);

      // Подгрузить и отрисовать соседние плантации текущего тумана
      (async () => {
        try {
          // Наблюдателю этот эндпоинт недоступен (403), пропускаем тихо
          if (String(authState.userRole) === 'observer') return;

          const tryFetch = async (suffix, queryParams = '') => {
            const url = queryParams 
              ? `api/plantations/${id}/${suffix}/?${queryParams}`
              : `api/plantations/${id}/${suffix}/`;
            return apiRequest(url, {}, refreshAccessToken, authState.accessToken);
          };

          let related = null;
          try {
            // корректный путь по бэку
            related = await tryFetch('related-map');
          } catch (e1) {
            const msg1 = String(e1?.message || '');
            if (msg1.includes('404') || msg1.includes('Not Found')) {
              try {
                related = await tryFetch('relatedmap');
              } catch (e2) {
                const msg2 = String(e2?.message || '');
                if (msg2.includes('404') || msg2.includes('Not Found')) {
                  try {
                    related = await tryFetch('related_map');
                  } catch (e3) {
                    const msg3 = String(e3?.message || '');
                    if (msg3.includes('404') || msg3.includes('Not Found')) {
                      // финальный фолбэк на старую опечатку
                      related = await tryFetch('realtedmap');
                    } else {
                      throw e3;
                    }
                  }
                } else {
                  throw e2;
                }
              }
            } else {
              throw e1;
            }
          }

          const items = Array.isArray(related?.results) ? related.results : (Array.isArray(related) ? related : []);
          const filtered = items.filter((p) => String(p?.id) !== String(id));
          filtered.forEach((p) => {
            const coords = Array.isArray(p?.coordinates)
              ? p.coordinates.map((c) => ({ lat: c.latitude, lng: c.longitude }))
              : [];
            if (coords.length) {
              const isApproved = !!p?.is_checked;
              const isRejected = !!p?.is_rejected;
              const fill = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#fadb14');
              const stroke = isApproved ? '#20c997' : (isRejected ? '#ff4d4f' : '#ff0000');
              const poly = new google.maps.Polygon({
                paths: coords,
                strokeColor: stroke,
                strokeOpacity: 1,
                strokeWeight: 3,
                fillColor: fill,
                fillOpacity: 0.32,
                map,
                zIndex: 10,
              });

              const statusText = isApproved ? 'Tasdiqlangan' : (isRejected ? 'Rad etilgan' : 'Kutilmoqda');
              const contentHtml = `
                <div class="tooltip-dark" style="min-width:200px"> 
                  <div class="tooltip-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#62a8ff"><path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z"/></svg>
                    <span>${(p?.name||'Без названия')}</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#bfbfbf"><path d="M20 6h-4V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16h2v-6h14l2-6a2 2 0 0 0-2-2ZM6 4h8v2H6V4Zm12.62 6H6v-2h14l-1.38 2Z"/></svg>
                    <span>ID: ${p?.id || ''}</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#bfbfbf"><path d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm3 3h8v8H8V8Z"/></svg>
                    <span>Maydon: ${p?.total_area ? Number(p.total_area).toFixed(1) : '-'} ga</span>
                  </div>
                  <div class="tooltip-row">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="${fill}"><path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/></svg>
                    <span>Holat: <span style="color:${fill};font-weight:600;">${statusText}</span></span>
                  </div>
                  <a class="tooltip-link" href="/plantations/${p.id}">Plantatsiyani ochish
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3Z"/></svg>
                  </a>
                </div>`;
              const info = new google.maps.InfoWindow({ content: contentHtml });
              try {
                info.addListener('domready', () => {
                  try {
                    const iwC = document.querySelector('.gm-style-iw-c');
                    if (iwC && !iwC.classList.contains('tooltip-dark')) iwC.classList.add('tooltip-dark');
                    const iwD = document.querySelector('.gm-style-iw-d');
                    if (iwD && !iwD.classList.contains('tooltip-dark')) iwD.classList.add('tooltip-dark');
                  } catch (_) {}
                });
              } catch (_) {}
              poly.addListener('mouseover', (e) => {
                info.setPosition(e.latLng);
                info.open({ map });
                poly.setOptions({ strokeWeight: 5 });
              });
              poly.addListener('mouseout', () => { info.close(); poly.setOptions({ strokeWeight: 3 }); });
              poly.addListener('click', () => {
                window.location.href = `/plantations/${p.id}`;
              });

              // больше не расширяем границы под соседние полигоны, чтобы не менять зум
              // coords.forEach((coord) => bounds.extend(coord));
            }
          });
          // if (hasAny) { map.fitBounds(bounds); } // сохранение текущего зума
        } catch (e) {
          // ignore failures to keep main map usable
        }
      })();
  };

  // Функция для подтверждения плантации (устанавливает is_checked: true)
  const handleApprove = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      // Отправляем только координаты и is_checked: true для подтверждения
      const updateData = {
        coordinates: plantation.coordinates,
        is_checked: true,
        is_rejected: false
      };
      
      await apiRequest(`api/plantations/${id}/update/`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      }, refreshAccessToken, authState.accessToken);

      
      // API автоматически очищает комментарии модерации; синхронизируем локальное состояние
      setPlantation((prev) => prev ? { ...prev, moderation_comment: [] } : prev);
      setSuccessMessage("Plantatsiya muvaffaqiyatli tasdiqlandi!");
      
      // Задержка перед редиректом, чтобы пользователь увидел уведомление
      setTimeout(() => {
        
        // Определяем, откуда пришел пользователь
        const fromPage = location.state?.from;
        
        
        if (fromPage === '/approved-plantations') {
          // Если пришел с approved-plantations, возвращаемся туда
          const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
          window.location.href = `/approved-plantations?page=${currentPage}`;
        } else if (fromPage === '/rejected-plantations') {
          // Если пришел с rejected-plantations, возвращаемся туда
          window.location.href = '/rejected-plantations';
        } else if (fromPage === '/deletion-requests') {
          // Если пришел с deletion-requests, возвращаемся туда с сохранением страницы
          const currentPage = location.state?.page || 1;
          window.location.href = `/deletion-requests?page=${currentPage}`;
        } else {
          // По умолчанию возвращаемся на moderation
        const currentPage = localStorage.getItem('moderationPage') || 1;
          const savedFilters = location.state?.filters;
          
          // Восстанавливаем фильтры в URL
          const searchParams = new URLSearchParams();
          searchParams.set('page', currentPage.toString());
          
          if (savedFilters) {
            if (savedFilters.action !== "All") searchParams.set('action', savedFilters.action);
            if (savedFilters.status !== "All") searchParams.set('status', savedFilters.status);
            if (savedFilters.type !== "All") searchParams.set('type', savedFilters.type);
            if (savedFilters.region !== "All") searchParams.set('region', savedFilters.region);
            if (savedFilters.district !== "All") searchParams.set('district', savedFilters.district);
            if (savedFilters.farmer !== "All") searchParams.set('farmer', savedFilters.farmer);
            // новые фильтры
            if (savedFilters.farmer_id !== "All") searchParams.set('farmer_id', savedFilters.farmer_id);
            if (savedFilters.min_area !== "All") searchParams.set('min_area', savedFilters.min_area);
            if (savedFilters.max_area !== "All") searchParams.set('max_area', savedFilters.max_area);
            if (savedFilters.min_fertility_score !== "All") searchParams.set('min_fertility_score', savedFilters.min_fertility_score);
            if (savedFilters.max_fertility_score !== "All") searchParams.set('max_fertility_score', savedFilters.max_fertility_score);
            if (savedFilters.min_irrigation_area !== "All") searchParams.set('min_irrigation_area', savedFilters.min_irrigation_area);
            if (savedFilters.max_irrigation_area !== "All") searchParams.set('max_irrigation_area', savedFilters.max_irrigation_area);
            if (savedFilters.is_fertile !== "All") searchParams.set('is_fertile', savedFilters.is_fertile);
            if (savedFilters.is_checked !== "All") searchParams.set('is_checked', savedFilters.is_checked);
            if (savedFilters.is_rejected !== "All") searchParams.set('is_rejected', savedFilters.is_rejected);
            if (savedFilters.is_deleting !== "All") searchParams.set('is_deleting', savedFilters.is_deleting);
            if (savedFilters.land_type !== "All") searchParams.set('land_type', savedFilters.land_type);
            if (savedFilters.created_after !== "All") searchParams.set('created_after', savedFilters.created_after);
            if (savedFilters.created_before !== "All") searchParams.set('created_before', savedFilters.created_before);
            if (savedFilters.moderated_after !== "All") searchParams.set('moderated_after', savedFilters.moderated_after);
            if (savedFilters.moderated_before !== "All") searchParams.set('moderated_before', savedFilters.moderated_before);
            if (savedFilters.garden_established_year !== "All") searchParams.set('garden_established_year', savedFilters.garden_established_year);
            if (savedFilters.min_established_year !== "All") searchParams.set('min_established_year', savedFilters.min_established_year);
            if (savedFilters.max_established_year !== "All") searchParams.set('max_established_year', savedFilters.max_established_year);
            if (savedFilters.created_by !== "All") searchParams.set('created_by', savedFilters.created_by);
            if (savedFilters.created_by_username !== "All") searchParams.set('created_by_username', savedFilters.created_by_username);
            if (savedFilters.moderated_by !== "All") searchParams.set('moderated_by', savedFilters.moderated_by);
            if (savedFilters.moderated_by_username !== "All") searchParams.set('moderated_by_username', savedFilters.moderated_by_username);
            if (savedFilters.has_moderation_comment !== "All") searchParams.set('has_moderation_comment', savedFilters.has_moderation_comment);
            if (savedFilters.sort_by) searchParams.set('sort_by', savedFilters.sort_by);
            if (savedFilters.sort_order) searchParams.set('sort_order', savedFilters.sort_order);
          }
          
          const newUrl = `/moderation?${searchParams.toString()}`;
          window.location.href = newUrl;
        }
      }, 2000);
    } catch (error) {
      console.error("Error approving plantation:", error);
      setError("Plantatsiyani tasdiqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }  };



  // Сброс состояния при изменении ID плантации
  useEffect(() => {
    // Прокрутка вверх при смене плантации
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setPolygonAreaHectares(null);
    mapInitializedRef.current = false;
    
    // Очищаем карту если она существует
    if (mapInstanceRef.current) {
      const mapDiv = document.getElementById("map");
      if (mapDiv) {
        mapDiv.innerHTML = '';
      }
      mapInstanceRef.current = null;
      polygonRef.current = null;
    }
  }, [id]);

  useEffect(() => {
    if (!authState.accessToken) {
      console.error("No access token found. Redirecting to login.");
      window.location.href = '/login';
      return;
    }
    fetchPlantationDetails();
  }, [fetchPlantationDetails, authState.accessToken, id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    if (plantation && !loading && !mapInitializedRef.current) {
      const loadGoogleMapsScript = () => {
        setTimeout(() => {
          const mapElement = document.getElementById("map");
          if (!mapElement) {
            return;
          }

        const existingScript = document.getElementById("googleMaps");
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=geometry`;
          script.id = "googleMaps";
          script.async = true;
          script.defer = true;
          script.setAttribute('loading', 'async');
          document.body.appendChild(script);
          script.onload = () => {
            if (typeof google !== "undefined") {
              initializeMap();
            }
          };
            script.onerror = () => {
              console.error("Failed to load Google Maps API");
          };
        } else {
          if (typeof google !== "undefined") {
            initializeMap();
          }
        }
        }, 100);
      };
      loadGoogleMapsScript();
    }
  }, [plantation, loading]);

  // Очистка полигонов при размонтировании компонента
  useEffect(() => {
    return () => {
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      mapInitializedRef.current = false;
      setRegionPolygons(prev => {
        prev.forEach((polygon) => {
          polygon.setMap(null);
        });
        return [];
      });
      setRegionLabels(prev => {
        prev.forEach(({ overlay }) => overlay.setMap(null));
        return [];
      });
    };
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900">
      {loading ? (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
            <p className="text-white">Ma'lumotlar yuklanmoqda...</p>
          </div>
        </div>
      ) : error ? (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 px-4 z-50">
          {error === "ACCESS_DENIED" ? (
            <>
              <div className="w-20 h-20 mx-auto mb-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-4">Рухсат йўқ</h1>
              
              <div className="text-white mb-6 text-center max-w-lg">
                <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
                  <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-3 mb-3">
                    <p className="text-orange-200 text-lg font-medium">Ушбу саҳифани кўриш учун ҳуқуқингиз йўқ.</p>
                    <p className="text-orange-100 mt-2">Статистика ва бошқа маълумотларни кўриш учун қўшимча ҳуқуқлар керак.</p>
                  </div>
                  
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a 
                    href="/login" 
                    className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Бошқа аккаунт билан кириш
                  </a>
                  
                  <button 
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Орқага қайтиш
                  </button>
                </div>
              </div>
            </>
          ) : (
              <>
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchPlantationDetails();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Qaytadan urinib ko'ring
            </button>
              </>
            )}
        </div>
      ) : plantation ? (
        <>
          <div className="w-full md:w-1/2 h-64 md:h-full p-4">
            <div 
              id="map" 
              className="w-full h-full border border-gray-600 rounded-lg"
                            style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                WebkitTouchCallout: 'none',
                WebkitUserDrag: 'none',
                KhtmlUserSelect: 'none'
              }}
              onDragStart={(e) => e.preventDefault()}
              onSelectStart={(e) => e.preventDefault()}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDropFiles}
            ></div>
          </div>
          <div className="w-full md:w-1/2 h-full overflow-y-auto p-6 bg-gray-800 shadow-lg relative">
            {/* Кнопка закрытия */}
            <CloseButtonWithReturn />
            
            
            <h1 className="text-lg font-semibold text-white mb-3 pr-12">{plantation.farmer ? plantation.farmer.name : "Nomalum fermer"} <span className="text-xs text-gray-400 ml-2">ID: {plantation?.id || id}</span></h1>
            
            {/* Блок статуса плантации */}
            <PlantationStatusIndicator plantation={plantation} />
            
            <PlantationHistory
              data={logsData}
              loading={logsLoading}
              error={logsError}
              action={logsActionFilter}
              setAction={setLogsActionFilter}
              page={logsPage}
              setPage={setLogsPage}
              pageSize={logsPageSize}
              onReload={refetchLogs}
            />
            
            {/* Автоматическое сравнение площадей */}
            {polygonAreaHectares !== null && plantation.total_area && (
              (() => {
                const declaredArea = Number(plantation.total_area);
                const calculatedArea = Number(polygonAreaHectares);
                const difference = Math.abs(calculatedArea - declaredArea);
                const differencePercent = (difference / declaredArea) * 100;
                const isSignificant = differencePercent > 5;
                const isCritical = differencePercent > 15;
                
                return (
                  <div className={`mb-4 p-3 rounded-lg border-2 ${
                    isCritical ? 'bg-red-900/30 border-red-500' :
                    isSignificant ? 'bg-yellow-900/30 border-yellow-500' :
                    'bg-green-900/30 border-green-500'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className={`w-5 h-5 ${
                            isCritical ? 'text-red-400' :
                            isSignificant ? 'text-yellow-400' :
                            'text-green-400'
                          }`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 3h14v14H3V3zm2 2v10h10V5H5zm2 2h6v6H7V7z"/>
                          </svg>
                          <span className={`font-semibold ${
                            isCritical ? 'text-red-200' :
                            isSignificant ? 'text-yellow-200' :
                            'text-green-200'
                          }`}>
                            Maydon taqqoslash
                          </span>
                          {(isSignificant || isCritical) && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              isCritical ? 'bg-red-700 text-red-100' : 'bg-yellow-700 text-yellow-100'
                            }`}>
                              {isCritical ? 'Kritik' : 'Ogohlantirish'}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Kiritilgan maydon:</div>
                            <div className="text-white font-bold">{declaredArea.toFixed(2)} GA</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs mb-1">Xaritadan hisoblangan:</div>
                            <div className="text-white font-bold">{calculatedArea.toFixed(2)} GA</div>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-gray-600">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 text-xs">Farq:</span>
                              <span className={`font-bold ${
                                isCritical ? 'text-red-300' :
                                isSignificant ? 'text-yellow-300' :
                                'text-green-300'
                              }`}>
                                {difference.toFixed(2)} GA ({differencePercent.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {(isSignificant || isCritical) && !selectedReasons.includes("Umumiy maydon bilan chizilgan maydon gektari bir xil emas") && (
                        <button
                          onClick={() => {
                            setSelectedReasons(prev => [...prev, "Umumiy maydon bilan chizilgan maydon gektari bir xil emas"]);
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex items-center gap-1 shrink-0"
                          title="Sababni avtomatik qo'shish"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                          </svg>
                          Sababni qo'shish
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded-md">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-900 border border-green-600 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-200 text-sm">{successMessage}</p>
                </div>
              </div>
            )}
            
            {/* Панель автоматических проверок */}
            {(() => {
              const issues = [];
              
              if (!plantation.images || plantation.images.length === 0) {
                issues.push({
                  severity: 'high',
                  message: 'Fotosurat mavjud emas',
                  suggestedReason: "Fotosurat yo'q yoki sifatsiz",
                  field: 'images'
                });
              }
              
              if (plantation.images && plantation.images.length < 2) {
                issues.push({
                  severity: 'medium',
                  message: `Faqat ${plantation.images.length} ta fotosurat (kamida 2 ta tavsiya etiladi)`,
                  suggestedReason: "Bog' maydoni fotosurati to'liq olinmagan",
                  field: 'images'
                });
              }
              
              if (!Array.isArray(plantation.fruit_areas) || plantation.fruit_areas.length === 0) {
                issues.push({
                  severity: 'high',
                  message: 'Mevali maydon kiritilmagan',
                  suggestedReason: "Mevali maydon turi kiritilmagan",
                  field: 'fruit_areas'
                });
              }
              
              const totalInvestment = Array.isArray(plantation.investments) 
                ? plantation.investments.reduce((sum, inv) => sum + (inv.investment_amount || 0), 0) 
                : 0;
              if (totalInvestment < 1000000) {
                issues.push({
                  severity: 'high',
                  message: totalInvestment === 0 
                    ? 'Investitsiya summasi kiritilmagan' 
                    : `Investitsiya summasi juda kam (${(totalInvestment / 1000000).toFixed(2)} mln so'm)`,
                  suggestedReason: "Investitsiya summasi noto'g'ri",
                  field: 'investments'
                });
              }
              
              if (plantation.total_area === plantation.empty_area && plantation.total_area > 0) {
                issues.push({
                  severity: 'high',
                  message: "Umumiy maydon va bo'sh maydon bir xil",
                  suggestedReason: "Umumiy maydon gektari bo'sh maydon gektari bilan bir xil",
                  field: 'area'
                });
              }
              
              if (!plantation.kontur_number || (Array.isArray(plantation.kontur_number) && plantation.kontur_number.length === 0)) {
                issues.push({
                  severity: 'medium',
                  message: 'Kontur raqami kiritilmagan',
                  suggestedReason: "Kontur raqami kiritilmagan",
                  field: 'kontur_number'
                });
              }
              
              // Проверка общей площади
              if (!plantation.total_area || plantation.total_area <= 0) {
                issues.push({
                  severity: 'high',
                  message: 'Bosh maydon kiritilmagan yoki 0',
                  suggestedReason: "Bosh maydon to'g'ri kiriting",
                  field: 'total_area'
                });
              } else if (plantation.total_area > 1000) {
                issues.push({
                  severity: 'medium',
                  message: `Bosh maydon juda katta (${plantation.total_area} GA)`,
                  suggestedReason: "Bosh maydon to'g'ri kiriting",
                  field: 'total_area'
                });
              }
              
              // Проверка сумм площадей
              if (Array.isArray(plantation.fruit_areas) && plantation.fruit_areas.length > 0) {
                const totalFruitArea = plantation.fruit_areas.reduce((sum, fa) => sum + (parseFloat(fa.area) || 0), 0);
                const expectedFruitArea = (plantation.total_area || 0) - (plantation.empty_area || 0);
                const areaDifference = Math.abs(totalFruitArea - expectedFruitArea);
                
                if (areaDifference > 0.1) {
                  issues.push({
                    severity: 'high',
                    message: `Mevali maydonlar yig'indisi (${totalFruitArea.toFixed(2)} GA) ekin maydoniga (${expectedFruitArea.toFixed(2)} GA) teng emas`,
                    suggestedReason: "Ekin maydoni gektari noto'g'ri",
                    field: 'fruit_areas'
                  });
                }
                
                // Проверка на отрицательные площади
                const hasNegativeArea = plantation.fruit_areas.some(fa => parseFloat(fa.area) < 0);
                if (hasNegativeArea) {
                  issues.push({
                    severity: 'high',
                    message: 'Mevali maydonlarda manfiy qiymat mavjud',
                    suggestedReason: "Ekin maydoni gektari noto'g'ri",
                    field: 'fruit_areas'
                  });
                }
              }
              
              // Проверка полигона
              if (plantation.polygon && plantation.polygon.coordinates) {
                const coords = plantation.polygon.coordinates[0];
                if (coords && coords.length < 4) {
                  issues.push({
                    severity: 'high',
                    message: `Chegara nuqtalari kam (${coords.length} ta, kamida 4 ta kerak)`,
                    suggestedReason: "Chegara noto'g'ri chizilgan",
                    field: 'polygon'
                  });
                } else if (coords && coords.length > 1000) {
                  issues.push({
                    severity: 'medium',
                    message: `Chegara nuqtalari juda ko'p (${coords.length} ta)`,
                    suggestedReason: "Chegara noto'g'ri chizilgan",
                    field: 'polygon'
                  });
                }
              }
              
              if (issues.length === 0) return null;
              
              return (
                <div className="mb-4 bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-200 font-semibold">Avtomatik tekshiruvlar</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-yellow-900 text-yellow-200 border border-yellow-700">
                      {issues.length} ta muammo
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {issues.map((issue, idx) => (
                      <div key={idx} className="bg-gray-800/50 rounded border-l-4 border-yellow-500 p-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                issue.severity === 'high' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'
                              }`}>
                                {issue.severity === 'high' ? 'Yuqori' : "O'rta"}
                              </span>
                              <span className="text-xs text-gray-400">{issue.field}</span>
                            </div>
                            <p className="text-sm text-gray-200">{issue.message}</p>
                          </div>
                          {issue.suggestedReason && !selectedReasons.includes(issue.suggestedReason) && (
                            <button
                              onClick={() => {
                                setSelectedReasons(prev => [...prev, issue.suggestedReason]);
                              }}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors shrink-0"
                              title="Sababni qo'shish"
                            >
                              + Qo'shish
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {issues.filter(i => i.suggestedReason && !selectedReasons.includes(i.suggestedReason)).length > 0 && (
                    <button
                      onClick={() => {
                        const newReasons = issues
                          .filter(i => i.suggestedReason && !selectedReasons.includes(i.suggestedReason))
                          .map(i => i.suggestedReason);
                        setSelectedReasons(prev => [...prev, ...newReasons]);
                      }}
                      className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Barcha sabablarni qo'shish ({issues.filter(i => i.suggestedReason && !selectedReasons.includes(i.suggestedReason)).length})
                    </button>
                  )}
                </div>
              );
            })()}
            
            <PlantationMetaCards plantation={plantation} />
            <InefficientAreasList fruit_areas={plantation.fruit_areas} />

            {/* Mavjud moderatsiya izohlari: ko'rish va o'chirish */}
            <div className="mb-4 p-3 rounded-md border border-gray-600 bg-gray-700/40">
              <div className="text-sm text-gray-300 mb-2">Mavjud izohlar</div>
              <div className="space-y-2">
                {Array.isArray(plantation.moderation_comment) && plantation.moderation_comment.length > 0 ? (
                  <>
                    <ModerationComments comments={plantation.moderation_comment} />
                  </>
                ) : (
                  <div className="text-gray-400 text-sm">Moderatsiya izohlari mavjud emas</div>
                )}
                {/* Fermer izohlari */}
                <UserComments comments={plantation.comments} />
                {(!Array.isArray(plantation.moderation_comment) || plantation.moderation_comment.length === 0) && 
                 (!Array.isArray(plantation.comments) || plantation.comments.length === 0) && (
                  <div className="text-gray-400 text-sm">Izohlar mavjud emas</div>
                )}
              </div>
            </div>

            {/* Двойной ряд: Fermer + Mevali hududlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {plantation.farmer && (
                <div className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-650" onClick={openFarmerPlantsModal} title="Fermer plantatsiyalari">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="font-semibold">Fermer</span>
                  </div>
                  <div className="space-y-1 text-gray-300 text-sm">
                    <p>Asoschi: {plantation.farmer.founder_name}</p>
                    <p>Direktor: {plantation.farmer.director_name}</p>
                    <p>Telefon: {plantation.farmer.phone_number}</p>
                    <p>Manzil: {plantation.farmer.address}</p>
                    <p>INN: {plantation.farmer.inn}</p>
                  </div>
                  </div>
                )}
              {Array.isArray(plantation.fruit_areas) && plantation.fruit_areas.length > 0 && (
                <FruitAreasList fruit_areas={plantation.fruit_areas} />
              )}
            </div>

            {createdByUser && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("user")}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Qo'shgan foydalanuvchi:
                  </span>
                </h2>
                {expandedSections.user && (
                  <div className="space-y-2 text-gray-300">
                    <p>Ism Familiya: {`${createdByUser.first_name} ${createdByUser.last_name}`.trim() || "—"}</p>
                    <p>Foydalanuvchi nomi: {createdByUser.username || "—"}</p>
                    <p>Telefon raqami: {createdByUser.phone_number || "—"}</p>
                    {createdByUser.location && (
                      <p>Joylashuv: {createdByUser.location.district || "—"}</p>
                    )}
                    <p>Oxirgi kirish: {
                      createdByUser.last_login 
                        ? new Date(createdByUser.last_login).toLocaleString("ru-RU", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : "Hech qachon"
                    }</p>
                    {createdByUser.contact_link && (
                      <p>Aloqa: <a 
                        href={createdByUser.contact_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {createdByUser.contact_link}
                      </a></p>
                    )}
                  </div>
                )}
              </div>
            )}
            {(plantation?.trellises?.filter(t => t && (
              (t.trellis_installed_area != null && t.trellis_installed_area !== '' && Number(t.trellis_installed_area) > 0) ||
              (t.trellis_count != null && t.trellis_count !== '' && Number(t.trellis_count) > 0)
            ))?.length > 0) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("trellises")}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" /></svg>
                  Shpallar:
                  </span>
                </h2>
                {expandedSections.trellises && (
                  <div>
                    {plantation.trellises
                      .filter(trellis => trellis && (
                        (trellis.trellis_installed_area != null && trellis.trellis_installed_area !== '' && Number(trellis.trellis_installed_area) > 0) ||
                        (trellis.trellis_count != null && trellis.trellis_count !== '' && Number(trellis.trellis_count) > 0)
                      ))
                      .map((trellis, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Shpalla turi:{" "}
                          {trellisTypeMapping[trellis.trellis_type]}
                        </p>
                        <p>
                          Shpalla maydoni: <span className="font-bold">{trellis.trellis_installed_area} GA</span>
                        </p>
                        <p>Shpallar soni: {trellis.trellis_count}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(plantation?.reservoirs?.filter(r => r && r.reservoir_volume != null && r.reservoir_volume !== '' && Number(r.reservoir_volume) > 0)?.length > 0) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h2
                  className="font-semibold text-lg mb-2 cursor-pointer text-white hover:text-green-400 transition-colors"
                  onClick={() => toggleSection("reservoirs")}
                >
                  <span className="inline-flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15s3-2 9-2 9 2 9 2-3 2-9 2-9-2-9-2z" /></svg>
                    Suv Xovузlari:
                  </span>
                </h2>
                {expandedSections.reservoirs && (
                  <div>
                    {plantation.reservoirs
                      .filter(reservoir => reservoir && reservoir.reservoir_volume != null && reservoir.reservoir_volume !== '' && Number(reservoir.reservoir_volume) > 0)
                      .map((reservoir, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 mb-2 text-gray-300">
                        <p>
                          Ombor turi:{" "}
                          {reservoirTypeMapping[reservoir.reservoir_type]}
                        </p>
                        <p>Hajmi: {reservoir.reservoir_volume}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {plantation.images?.length > 0 && (
              <div className="mt-6 bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Galereya:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {plantation.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.image_url}
                      alt={`Изображение ${idx + 1}`}
                      className="w-full h-24 object-cover border border-gray-600 rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(img.image_url)}
                    />
                  ))}
                </div>
              </div>
            )}
            {/* RBAC: подсказка по горячим клавишам для superuser */}
            {authState.userRole === "superuser" && (
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-2 text-xs text-gray-300 mt-3">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 font-mono">Ctrl+Enter</kbd>
                    <span>Tasdiqlash</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 font-mono">Alt+Q</kbd>
                    <span>Rad etish</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 font-mono">Alt+1-9</kbd>
                    <span>Sabab tanlash</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 font-mono">Esc</kbd>
                    <span>Yopish</span>
                  </span>
                </div>
              </div>
            )}
            {/* RBAC: модальные окна только для superuser */}
            {authState.userRole === "superuser" && isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="relative bg-gray-800 p-6 rounded-md w-[680px] max-w-[90vw] border border-gray-600"
                       onPaste={handlePasteImage}
                       onDragOver={handleDragOver}
                       onDragEnter={handleDragEnter}
                       onDragLeave={handleDragLeave}
                       onDrop={handleDropFiles}
                  >
                    <button onClick={closeModal} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                    <h2 className="text-xl mb-4 text-white">Plantatsiyani rad etish</h2>
                    <p className="text-gray-300 mb-3">Bu plantatsiyani rad etishni xohlaysizmi? Har bir bandga rasm qo'shish ixtiyoriy.</p>

                    {/* Mavjud moderatsiya izohlari: ko'rish va o'chirish */}
                    <div className="mb-4 p-3 rounded-md border border-gray-600 bg-gray-700/40">
                      <div className="text-sm text-gray-300 mb-2">Mavjud izohlar</div>
                      <div className="space-y-2">
                        {Array.isArray(plantation.moderation_comment) && plantation.moderation_comment.length > 0 ? (
                          <>
                            {/* Обычные комментарии */}
                            {plantation.moderation_comment
                              .filter(mc => !mc?.author && !mc?.action && !mc?.timestamp && !mc?.author_role)
                              .map((mc, idx) => (
                                <div key={mc?.id ?? idx} className="p-3 rounded border border-gray-600 bg-gray-700/40 mb-2">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <div className="text-gray-200 text-sm whitespace-pre-wrap">{mc?.text || ''}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                              {mc?.image && typeof mc.image === 'string' && (
                                <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                  <img src={mc.image} alt="comment" className="w-12 h-12 object-cover rounded border border-gray-600" />
                                </a>
                              )}
                              {canDeleteComments && mc?.id && (
              <button
                                  onClick={() => openCommentDeleteModal(mc.id)}
                                  className="text-red-400 hover:text-red-300 shrink-0"
                                  title="O'chirish"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                  </svg>
              </button>
                              )}
                            </div>
                                  </div>
                                </div>
                              ))}
                            
                            {/* Расширенные комментарии */}
                            {plantation.moderation_comment
                              .filter(mc => mc?.author || mc?.action || mc?.timestamp || mc?.author_role)
                              .map((mc, idx) => (
                                <div key={mc?.id ?? idx} className="p-3 rounded border border-blue-500/50 bg-blue-900/20 mb-2">
                                  <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                      <div className="text-gray-200 text-sm whitespace-pre-wrap mb-2">{mc?.text || ''}</div>
                                      <div className="flex items-center gap-4 text-xs text-blue-300">
                                        {mc?.author && (
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>Muallif: {mc.author}</span>
                                          </div>
                                        )}
                                        {mc?.author_role && (
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Rol: {mc.author_role}</span>
                                          </div>
                                        )}
                                        {mc?.timestamp && (
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>
                                              {new Date(mc.timestamp).toLocaleString("ru-RU", {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                        )}
                                        {mc?.action && (
                                          <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Harakat: {translateAction(mc.action)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {mc?.image && typeof mc.image === 'string' && (
                                        <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                          <img src={mc.image} alt="comment" className="w-12 h-12 object-cover rounded border border-blue-500/50" />
                                        </a>
                                      )}
                                      {canDeleteComments && mc?.id && (
                                        <button
                                          onClick={() => openCommentDeleteModal(mc.id)}
                                          className="text-red-400 hover:text-red-300 shrink-0"
                                          title="O'chirish"
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </>
                        ) : (
                          <div className="text-gray-400 text-sm">Moderatsiya izohlari mavjud emas</div>
                        )}
                        {/* Fermer izohlari */}
                        <UserComments comments={plantation.comments} />
                        {(!Array.isArray(plantation.moderation_comment) || plantation.moderation_comment.length === 0) && 
                         (!Array.isArray(plantation.comments) || plantation.comments.length === 0) && (
                          <div className="text-gray-400 text-sm">Izohlar mavjud emas</div>
                        )}
                      </div>
                    </div>

                    {/* Reasons multi-select */}
                    <div className="mb-4 p-3 rounded-md border border-gray-600 bg-gray-700/40">
                      <div className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                        <span>Rad etish sabablari (bir nechtasini tanlash mumkin):</span>
                        <span className="text-xs text-gray-500">
                          <kbd className="px-1 py-0.5 bg-gray-800 rounded text-[10px]">Alt+1-9</kbd> tez tanlash
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DEFAULT_REJECT_REASONS.map((reason, index) => {
                          const checked = selectedReasons.includes(reason);
                          const keyNumber = index + 1;
                          const hasHotkey = index < 9; // Только первые 9 имеют горячие клавиши
                          return (
                            <label key={reason} className="flex items-center gap-2 text-gray-200 text-sm hover:bg-gray-700/50 p-1.5 rounded transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedReasons((prev) => {
                                    if (e.target.checked) return [...prev, reason];
                                    return prev.filter((r) => r !== reason);
                                  });
                                }}
                              />
                              <span className="inline-flex items-center gap-1.5 select-none flex-1">
                                {hasHotkey && (
                                  <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-600 text-[10px] font-mono text-gray-400 shrink-0">
                                    {keyNumber}
                                  </kbd>
                                )}
                                <span className={hasHotkey ? '' : 'ml-0.5'}>{reason}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
              <button
                          type="button"
                          className="px-3 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-colors text-sm flex items-center gap-2"
                           onClick={() => {
                             if (!selectedReasons.length) return;
                             const existingTexts = new Set((moderationItems || []).map((i) => (i.text || '').trim().toLowerCase()));
                             const toAdd = selectedReasons.filter((r) => !existingTexts.has(r.trim().toLowerCase()))
                               .map((r) => ({ text: r, image: null, preview: null }));
                             if (toAdd.length) {
                               const base = (moderationItems || []).filter((i) => (String(i.text || '').trim().length > 0) || (i.image instanceof File));
                               setModerationItems([...base, ...toAdd]);
                             }
                             setSelectedReasons([]);
                           }}
                         >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                          Tanlanganlarni qo'shish
                </button>
                        {selectedReasons.length > 0 && (
                <button
                            type="button"
                            className="px-3 py-1.5 rounded bg-gray-700/70 text-gray-300 hover:bg-gray-600/70 text-xs"
                            onClick={() => setSelectedReasons([])}
                          >
                            Tozalash
              </button>
                        )}
              </div>
                    </div>

                    {/* Drag & Drop hint removed by request */}

                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                      {moderationItems.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-md border border-gray-600 bg-gray-700/60">
                          <label className="block text-sm text-gray-300 mb-1">Izoh #{idx + 1}</label>
                    <textarea
                            className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400"
                            value={item.text}
                            onChange={(e) => {
                              const next = [...moderationItems];
                              next[idx] = { ...next[idx], text: e.target.value };
                              setModerationItems(next);
                            }}
                            onFocus={() => setFocusedIdx(idx)}
                            onClick={() => setFocusedIdx(idx)}
                            placeholder="Matn..."
                            rows={3}
                          />
                          <div className="mt-2 flex items-center gap-3">
                            <input
                               ref={(el) => (fileInputsRef.current[idx] = el)}
                               type="file"
                               accept="image/*"
                               onChange={(e) => {
                                 const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                                 if (file) {
                                   if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
                                     alert("Rasm formati noto'g'ri. JPG, PNG yoki WEBP tanlang.");
                                     return;
                                   }
                                   if (file.size > MAX_IMAGE_SIZE) {
                                     alert("Rasm hajmi 10MB dan oshmasligi kerak.");
                                     return;
                                   }
                                 }
                                 const next = [...moderationItems];
                                 try { if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview); } catch(_) {}
                                 const preview = file ? URL.createObjectURL(file) : null;
                                 next[idx] = { ...next[idx], image: file, preview };
                                 setModerationItems(next);
                                 try { /* debug removed */ } catch {}
                               }}
                               className="hidden"
                             />
                             <button
                               type="button"
                               className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm flex items-center gap-2"
                               onClick={() => fileInputsRef.current[idx] && fileInputsRef.current[idx].click()}
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5 5 5M12 5v12"/></svg>
                               Fayl tanlash
                             </button>
                             {item.image && (
                               <div className="flex items-center gap-2 min-w-0">
                                 {item.preview && (
                                   <img src={item.preview} alt="preview" className="w-16 h-16 rounded border border-gray-600 object-cover" />
                                 )}
                                 <span className="text-xs text-gray-300 truncate max-w-[180px]">{item.image.name}</span>
                                 <button
                                   type="button"
                                   className="text-xs text-gray-400 hover:text-white"
                                   onClick={() => {
                                     const next = [...moderationItems];
                                     try { if (next[idx]?.preview) URL.revokeObjectURL(next[idx].preview); } catch(_) {}
                                     next[idx] = { ...next[idx], image: null, preview: null };
                                     setModerationItems(next);
                                   }}
                                   title="Rasmni olib tashlash"
                                 >
                                   ✕
                                 </button>
                               </div>
                             )}
                          </div>
                          {moderationItems.length > 1 && (
                            <button
                              className="mt-2 text-xs text-red-300 hover:text-red-200"
                              onClick={() => { const rem = moderationItems[idx]; try { if (rem?.preview) URL.revokeObjectURL(rem.preview); } catch(_) {}; setModerationItems(moderationItems.filter((_, i) => i !== idx)); }}
                            >
                              Olib tashlash
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <button
                        className="text-sm text-gray-300 hover:text-white"
                        onClick={() => setModerationItems([...(moderationItems || []), { text: "", image: null, preview: null }])}
                      >
                        + Yana qo'shish
                      </button>
                      <button
                        className="text-xs text-gray-400 hover:text-gray-300"
                        onClick={() => {
                          try { moderationItems.forEach((it) => { if (it?.preview) { try { URL.revokeObjectURL(it.preview); } catch(_) {} } }); } catch(_) {};
                          setModerationItems([{ text: customReason || "", image: null, preview: null }]);
                        }}
                        title="Bir matnli oddiy rad"
                      >
                        Oddiy matn
                      </button>
                    </div>
                    <div className="flex justify-end space-x-4 mt-4">
                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                        onClick={handleConfirm}
                      >
                        Rad etish
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                        onClick={closeModal}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {canDeletePlantation() && isDeleteModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={closeDeleteModal}>
                  <div className="relative bg-gray-800 p-6 rounded-md w-96 border border-gray-600" onClick={(e) => e.stopPropagation()}>
                    <button onClick={closeDeleteModal} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                    <h2 className="text-xl mb-4 text-white">Plantatsiyani o'chirish</h2>
                    <p className="text-gray-300 mb-4">Bu plantatsiyani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.</p>
                    <div className="flex justify-end space-x-4">
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                        onClick={handleDeleteConfirm}
                      >
                        O'chirish
                      </button>
                      <button
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                        onClick={closeDeleteModal}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {/* Confirm delete moderation comment modal */}
            {authState.userRole === "superuser" && isCommentDeleteOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={closeCommentDeleteModal}>
                <div className="relative bg-gray-800 p-6 rounded-md w-[420px] max-w-[90vw] border border-gray-600" onClick={(e) => e.stopPropagation()}>
                  <button onClick={closeCommentDeleteModal} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                  <h3 className="text-lg mb-3 text-white">Izohni o'chirish</h3>
                  <p className="text-gray-300 mb-4">Ushbu moderatsiya izohini o'chirishni tasdiqlaysizmi?</p>
                  <div className="flex justify-end gap-3">
                    <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700" onClick={closeCommentDeleteModal}>Bekor qilish</button>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onClick={confirmDeleteModerationComment} disabled={!pendingCommentId}>O'chirish</button>
            </div>
          </div>
              </div>
            )}
            {authState.userRole === "superuser" && isApproveModalOpen && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50" onClick={closeApproveModal}>
                <div className="relative bg-gray-800 p-6 rounded-md w-96 border border-gray-600" onClick={(e) => e.stopPropagation()}>
                  <button onClick={closeApproveModal} className="absolute top-2 right-2 text-gray-400 hover:text-white">✕</button>
                  <h2 className="text-xl mb-4 text-white">Tasdiqlashni tasdiqlaysizmi?</h2>
                  <p className="text-gray-300 mb-4">Ushbu plantatsiyani tasdiqlamoqchimisiz? Bu amal statusni "Tasdiqlangan" ga o'zgartiradi.</p>
                  <div className="flex justify-end space-x-4">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      onClick={() => { closeApproveModal(); handleApprove(); }}
                    >
                      Ha, tasdiqlash
                    </button>
                    <button
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                      onClick={closeApproveModal}
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <p className="text-white">Plantatsiya topilmadi</p>
        </div>
      )}

      {/* Плавающая панель быстрых действий */}
      {canDeletePlantation() && plantation && !isDeleted && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-gray-800/95 backdrop-blur-sm border-2 border-gray-600 rounded-full shadow-2xl px-4 py-2 flex items-center gap-3">
            <button
              onClick={openApproveModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium shadow-lg"
              title="Tasdiqlash (Ctrl+Enter)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Tasdiqlash</span>
              <span className="text-xs opacity-75">(Ctrl+Enter)</span>
            </button>
            
            <div className="w-px h-8 bg-gray-600"></div>
            
            <button
              onClick={openModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium shadow-lg"
              title="Rad etish (Alt+Q)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Rad etish</span>
              <span className="text-xs opacity-75">(Alt+Q)</span>
            </button>

            <div className="w-px h-8 bg-gray-600"></div>
            
            
            <button
              onClick={openDeleteModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium shadow-lg"
              title="To'liq o'chirish"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>To'liq o'chirish</span>
            </button>
          </div>
        </div>
      )}

      {farmerPlantsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setFarmerPlantsOpen(false)}></div>
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-11/12 max-w-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white text-lg font-semibold">Fermer plantatsiyalari</h3>
              <button className="text-gray-300 hover:text-white px-2 py-1 bg-gray-700 rounded" onClick={() => setFarmerPlantsOpen(false)}>✕</button>
            </div>
            {farmerPlantsLoading ? (
              <div className="text-gray-300">Yuklanmoqda...</div>
            ) : farmerPlantsError ? (
              <div className="text-red-400">{farmerPlantsError}</div>
            ) : farmerPlants.length === 0 ? (
              <div className="text-gray-300">Plantatsiyalar topilmadi</div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {farmerPlants.map((p) => {
                  const isApproved = !!p.is_checked;
                  const isRejected = !!p.is_rejected;
                  const badgeCls = isApproved ? 'bg-green-600/20 text-green-300 border-green-500/50' : (isRejected ? 'bg-red-600/20 text-red-300 border-red-500/50' : 'bg-yellow-600/20 text-yellow-300 border-yellow-500/50');
                  const statusText = isApproved ? 'Tasdiqlangan' : (isRejected ? 'Rad etilgan' : 'Kutilmoqda');
                  return (
                    <div key={p.id} className="p-3 bg-gray-700 rounded border border-gray-600 hover:bg-gray-650 cursor-pointer" onClick={() => { setFarmerPlantsOpen(false); window.location.href = `/plantations/${p.id}`; }}>
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium truncate">{p.name || 'Fermer'}</div>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${badgeCls}`}>{statusText}</span>
                      </div>
                      <div className="text-gray-400 text-xs mt-1">ID: {p.id} • Maydon: {Number(p.total_area || 0).toFixed(1)} ga</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Увеличенное изображение"
            className="max-w-full max-h-full rounded-md"
          />
        </div>
      )}


    </div>
  );
};
export default EditPlantation;