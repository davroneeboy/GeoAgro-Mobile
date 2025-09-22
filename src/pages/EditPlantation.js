import React, { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { GOOGLE_API_KEY } from "../config";
import { apiRequest } from "../utils/apiUtils";
import { fetchFarmerPlantations } from "../api/api";
import {
  landTypeMapping,
  trellisTypeMapping,
  reservoirTypeMapping,
} from "../context/constants";
/* global google */

const EditPlantation = () => {
  const { id } = useParams();
  const location = useLocation();

  const [plantation, setPlantation] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [coordinatesChanged, setCoordinatesChanged] = useState(false);
  // const [area, setArea] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [moderationItems, setModerationItems] = useState([]);
  const { authState, refreshAccessToken } = useContext(AuthContext);
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

  const DEFAULT_REJECT_REASONS = [
    "Investitsiya summasi noto'g'ri",
    "Fotosurat yo'q yoki sifatsiz",
    "Bog' maydoni fotosurati to'liq olinmagan",
    "Umumiy maydon gektari bo'sh maydon gektari bilan bir xil",
    "Mevali maydon turi kiritilmagan",
    "Ekin maydoni gektari noto'g'ri",
    "Chegara yonidagi fermer bilan ustma-ust tushgan",
    "Chegara noto'g'ri chizilgan"
  ];
  const [selectedReasons, setSelectedReasons] = useState([]);

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
  const [dragActive, setDragActive] = useState(false);
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
    try { console.log(`[reject] ${source} image:`, { name: file.name, size: file.size, type: file.type }); } catch {}
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

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragEnter = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
  const handleDropFiles = (e) => {
    e.preventDefault();
    setDragActive(false);
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
      
      console.log('[reject] append mode, will POST', unique.length, 'comments');
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
        console.log(`[reject] submit #${idx + 1}/${unique.length}:`, { text, hasImage: !!image });
        try {
          const dbg = [];
          for (const [k, v] of fd.entries()) { dbg.push([k, (v && v.name) ? v.name : v]); }
          console.log('[reject] formdata:', dbg);
        } catch {}
        const resp = await apiRequest(`api/plantations/${plantation.id}/reject/`, {
          method: 'POST',
          body: fd,
      }, refreshAccessToken, authState.accessToken);
        try { console.log(`[reject] response #${idx + 1}:`, resp); } catch {}
      }

      console.log("Plantation rejected successfully");
      setSuccessMessage("Rad etish sabab(lar)i qo'shildi");
      closeModal();
      // Navigation suppressed intentionally to allow console inspection after reject
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
         console.log('[reject] error detail:', { status: error?.response?.status, data: error?.response?.data });
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
      if (fromPage === '/approved-plantations') {
        const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
        window.location.href = `/approved-plantations?page=${currentPage}`;
      } else if (fromPage === '/rejected-plantations') {
        window.location.href = '/rejected-plantations';
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
        console.log("Access denied for user details, continuing without user info");
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
      console.log("Error response status:", error.response?.status);
      console.log("Error response data:", error.response?.data);
      
      // RBAC: Проверяем, является ли ошибка связанной с доступом
      if (error.response?.status === 404 || error.response?.status === 403) {
        console.log("Setting access denied error message");
        setError("ACCESS_DENIED");
      } else {
        console.log("Setting generic error message");
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
    // Проверяем, что элемент карты существует
    const mapElement = document.getElementById("map");
    if (!mapElement) {
      console.warn("Map element not found, skipping map initialization");
      return;
    }

    const map = new google.maps.Map(mapElement, {
      center: { lat: 41.2995, lng: 69.2401 },
      zoom: 12,
      mapTypeId: "satellite",
      disableDefaultUI: true,
    });



    if (plantation && plantation.coordinates) {
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

      // Добавляем такой же hover-лейбл в правом верхнем углу и для основной плантации
      const mainLabelText = `${getRegionNameById(plantation?.district?.region)}, ${plantation?.district?.name || ""}`;
      addPolygonEventListeners(polygon, mainLabelText, map);

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
      };

      polygon.addListener("mouseup", updateCoordinates);

      // Устанавливаем границы для отображения полигона
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

          const tryFetch = async (suffix) => apiRequest(
            `api/plantations/${id}/${suffix}/`,
            {},
            refreshAccessToken,
            authState.accessToken
          );

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
                    <span>Maydon: ${(p?.total_area ?? '-') } ga</span>
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
    }
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

      console.log("Plantation approved successfully");
      setSuccessMessage("Plantatsiya muvaffaqiyatli tasdiqlandi!");
      
      // Задержка перед редиректом, чтобы пользователь увидел уведомление
      setTimeout(() => {
        // Определяем, откуда пришел пользователь
        const fromPage = location.state?.from;
        console.log('Approve redirect, fromPage:', fromPage, 'location.state:', location.state);
        
        if (fromPage === '/approved-plantations') {
          // Если пришел с approved-plantations, возвращаемся туда
          const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
          window.location.href = `/approved-plantations?page=${currentPage}`;
        } else if (fromPage === '/rejected-plantations') {
          // Если пришел с rejected-plantations, возвращаемся туда
          window.location.href = '/rejected-plantations';
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
          }
          
          const newUrl = `/moderation?${searchParams.toString()}`;
          window.location.href = newUrl;
        }
      }, 2000);
    } catch (error) {
      console.error("Error approving plantation:", error);
      setError("Plantatsiyani tasdiqlashda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    }
  };



  useEffect(() => {
    if (!authState.accessToken) {
      console.error("No access token found. Redirecting to login.");
      window.location.href = '/login';
      return;
    }
    fetchPlantationDetails();
  }, [fetchPlantationDetails, authState.accessToken]);

  useEffect(() => {
    if (plantation && !loading) {
      const loadGoogleMapsScript = () => {
        // Добавляем небольшую задержку, чтобы убедиться, что DOM готов
        setTimeout(() => {
          const mapElement = document.getElementById("map");
          if (!mapElement) {
            console.warn("Map element not ready yet");
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
              
              <h1 className="text-3xl font-bold text-white mb-6">Рухсат йўқ</h1>
              
              <div className="text-white mb-8 text-center max-w-lg">
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                  <div className="bg-orange-900/30 border border-orange-600/50 rounded-lg p-4 mb-4">
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
            <button
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-full transition-colors z-10"
              onClick={() => {
                // Определяем, откуда пришел пользователь
                const fromPage = location.state?.from;
                console.log('Close button clicked, fromPage:', fromPage, 'location.state:', location.state);
                
                if (fromPage === '/approved-plantations') {
                  // Если пришел с approved-plantations, возвращаемся туда
                  const currentPage = localStorage.getItem('approvedPlantationsPage') || 1;
                  window.location.href = `/approved-plantations?page=${currentPage}`;
                } else if (fromPage === '/rejected-plantations') {
                  // Если пришел с rejected-plantations, возвращаемся туда
                  window.location.href = '/rejected-plantations';
                } else if (fromPage === '/plantations/uz') {
                  // Если пришли с карты плантаций, возвращаемся на неё
                  window.location.href = '/plantations/uz';
                } else {
                  // По умолчанию возвращаемся на moderation
                console.log('Navigating to moderation...');
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
                  }
                  
                  const newUrl = `/moderation?${searchParams.toString()}`;
                  window.location.href = newUrl;
                }
              }}
              title="Закрыть"
            >
              ✕
            </button>
            <h1 className="text-xl font-semibold text-white mb-4 pr-12">{plantation.farmer ? plantation.farmer.name : "Nomalum fermer"} <span className="text-xs text-gray-400 ml-2">ID: {plantation?.id || id}</span></h1>
            
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Yer turi:</p>
                <p className="text-white">{landTypeMapping[plantation.land_type]}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Maydoni:</p>
                <p className="text-white">{plantation.total_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Hosildorlik bahosi:</p>
                <p className="text-white">{plantation.fertility_score}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Devor bilan o'ralgan:</p>
                <p className="text-white">{plantation.fenced ? "✅" : "🚫"}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Bo'sh maydon:</p>
                <p className="text-white">{plantation.empty_area} GA</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Suv xovuzlari soni:</p>
                <p className="text-white">{plantation.reservoir_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Quduqlar soni:</p>
                <p className="text-white">{plantation.pump_station_count}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Qo'shilgan vaqti:</p>
                <p className="text-white">
                  {plantation.created_at 
                    ? new Date(plantation.created_at).toLocaleString("ru-RU", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : "—"
                  }
                </p>
                {plantation.updated_at && (
                  <div className="mt-2 text-xs text-amber-300 flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-900/50 border border-amber-600/60">Yangilangan</span>
                    <span className="text-white">
                      {new Date(plantation.updated_at).toLocaleString("ru-RU", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="font-semibold text-gray-300">Tomchilab sug'oriladigan maydon:</p>
                <p className="text-white">{plantation.irrigation_area} GA</p>
              </div>
              {plantation.investments && plantation.investments.length > 0 && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="font-semibold text-gray-300 mb-2">Investitsiyalar:</p>
                  <div className="space-y-1 mb-3">
                    {plantation.investments.map((investment, index) => (
                      <div key={investment.id || index} className="text-white text-sm">
                        <span className="text-gray-400">
                          {investment.invest_type === 1 ? 'Mahalliy' : investment.invest_type === 2 ? 'Xorijiy' : `Turi ${investment.invest_type}`}:
                        </span>
                        <span className="ml-2 font-medium">
                          {new Intl.NumberFormat('uz-UZ').format(investment.investment_amount)} UZS
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-600 pt-2">
                    <p className="font-semibold text-gray-300">Jami investitsiyalar:</p>
                    <p className="text-white font-bold text-green-400 text-lg">
                      {new Intl.NumberFormat('uz-UZ').format(
                        plantation.investments.reduce((total, inv) => total + (inv.investment_amount || 0), 0)
                      )} UZS
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Секция с комментарием модерации */}
            {(Array.isArray(plantation.moderation_comment) ? plantation.moderation_comment.length > 0 : !!plantation.moderation_comment) && (
              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="font-semibold">Moderatsiya kommenti</span>
                </div>
                <div className="p-3 rounded-lg border border-gray-600 bg-gray-800/50 space-y-2">
                  {Array.isArray(plantation.moderation_comment) ? (
                    plantation.moderation_comment.map((mc, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="text-gray-200 text-sm flex-1 whitespace-pre-wrap">{mc?.text || ''}</div>
                        {mc?.image && typeof mc.image === 'string' && (
                          <a href={mc.image} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <img src={mc.image} alt="comment" className="w-16 h-16 object-cover rounded border border-gray-600" />
                          </a>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-200 text-sm">{String(plantation.moderation_comment)}</p>
                  )}
                </div>
              </div>
            )}

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
              {plantation.fruit_areas.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2 text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4c-3 0-5 2-5 5 0 4 5 9 5 9s5-5 5-9c0-3-2-5-5-5z" /></svg>
                    <span className="font-semibold">Mevali hududlar</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2">
                    {plantation.fruit_areas.map((area, idx) => (
                      <div key={idx} className="border-b border-gray-600 pb-2 text-gray-300 text-sm last:border-b-0">
                        <p>Meva: {area.fruit}</p>
                        <p>Nav: {area.variety}</p>
                        <p>Maydoni: {area.area} GA</p>
                        <p>Ekilgan yili: {area.planted_year}</p>
                      </div>
                    ))}
                  </div>
              </div>
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
                          Shpalla maydoni: {trellis.trellis_installed_area} GA
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
            {/* RBAC: кнопки модерации только для superuser */}
            {authState.userRole === "superuser" && (
            <div className="flex flex-col gap-2 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:justify-end sm:flex-1">
              <button
                  className="w-full sm:w-auto bg-green-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-green-600 transition-colors inline-flex items-center gap-2"
                onClick={handleApprove}
                  disabled={isDeleted}
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Tasdiqlash
              </button>
              <button
                  className="w-full sm:w-auto bg-red-500 mt-3 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-red-600 transition-colors inline-flex items-center gap-2"
                onClick={openModal}
                  disabled={isDeleted}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  Rad etish
                </button>
              </div>
              <div className="sm:flex-none mt-2 sm:mt-2">
                <button
                  className="w-full sm:w-auto bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50 hover:bg-red-800 transition-colors inline-flex items-center gap-2"
                  onClick={openDeleteModal}
                  disabled={isDeleted}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                O'chirish
              </button>
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

                    {/* Reasons multi-select */}
                    <div className="mb-4 p-3 rounded-md border border-gray-600 bg-gray-700/40">
                      <div className="text-sm text-gray-300 mb-2">Rad etish sabablari (bir nechtasini tanlash mumkin):</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DEFAULT_REJECT_REASONS.map((reason) => {
                          const checked = selectedReasons.includes(reason);
                          return (
                            <label key={reason} className="flex items-center gap-2 text-gray-200 text-sm">
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
                              <span className="select-none">{reason}</span>
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
                                 try { console.log(`[reject] file selected #${idx + 1}:`, file ? { name: file.name, size: file.size, type: file.type } : null); } catch {}
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
            {authState.userRole === "superuser" && isDeleteModalOpen && (
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
          </div>
        </>
      ) : (
        <div className="flex justify-center items-center h-full w-full bg-gray-900">
          <p className="text-white">Plantatsiya topilmadi</p>
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
