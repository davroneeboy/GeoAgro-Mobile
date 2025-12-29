// Auth Types
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;
}

export interface LoginData {
  access: string;
  refresh: string;
  username: string;
}

// API Types
export interface ApiResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

// Plantation Types
export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Plantation {
  id: number;
  name?: string;
  total_area: number;
  coordinates?: Coordinate[];
  land_type?: string | number;
  crop_type?: string;
  farmer_name?: string;
  farmer?: {
    id: number;
    name: string;
    inn?: string | number;
    director_name?: string;
    phone_number?: string;
    established_year?: string | number;
    founder_name?: string;
    address?: string;
    resolution_number?: string;
  };
  district_id?: number;
  district?: {
    id?: number;
    name: string;
    region: number;
  };
  district_name?: string;
  region_id?: number;
  region_name?: string;
  created_at?: string;
  updated_at?: string;
  is_checked?: boolean;
  is_rejected?: boolean;
  moderated_at?: string | null;
  moderated_by?: number | null;
  moderation_comment?: string | null | Array<{
    id?: number;
    text: string;
    image?: string | null;
    action?: string;
    author?: string;
    author_id?: number;
    timestamp?: string;
    author_role?: string;
  }>;
  archived?: boolean;
  created_by?: number;
  garden_established_year?: number;
  planted_area?: number;
  is_deleting?: boolean;
  // Дополнительные поля из API
  types?: {
    plantation_type?: number;
    type_choice?: number;
    subtype?: number | null;
  } | number; // Может быть объектом или числом (ID типа)
  empty_area?: number;
  not_usable_area?: number;
  economic_inefficient_area?: number;
  irrigation_area?: number;
  fertility_score?: number;
  is_fertile?: boolean;
  irrigation_systems_count?: number;
  reservoir_count?: number;
  pump_station_count?: number;
  kontur_number?: number[];
  investments?: Array<{
    id?: number;
    invest_type: number;
    investment_amount: number;
  }>;
  reservoirs?: any[];
  trellises?: any[];
  fruit_areas?: FruitArea[];
}

export interface PlantationFormData {
  name: string;
  total_area: number;
  coordinates: Coordinate[];
  land_type: string;
  crop_type: string;
  farmer_id?: number;
  district_id: number;
}

// Region & District Types
export interface Region {
  id: number;
  name: string;
  districts: District[];
}

export interface District {
  id: number;
  name: string;
  region_id: number;
}

// Statistics Types
export interface RegionStats {
  region_id: number;
  region_name: string;
  total_plantations: number;
  total_area: number;
  crop_distribution: CropDistribution[];
}

export interface CropDistribution {
  crop_type: string;
  count: number;
  area: number;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

// Map Types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Error Types
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Map Progressive Loading Types
export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string | number;
    name: string;
    ADM1_UZ?: string;
    ADM1_EN?: string;
    ADM1_RU?: string;
    region_name?: string;
    Shape_Leng?: number;
    Shape_Area?: number;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  name?: string;
  features: GeoJSONFeature[];
}

export interface MapZoomConfig {
  INITIAL: number;
  REGION_OPEN: number;
  DISTRICT_OPEN: number;
  PLANTATIONS_LOAD: number;
  HIDE_FILL: number;
}

export interface RegionCache {
  [regionId: string]: GeoJSONCollection;
}

export interface DistrictBounds {
  id: number | string;
  name: string;
  regionId: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
}

export interface PlantationCache {
  [districtId: string]: {
    data: Plantation[];
    timestamp: number;
  };
}

export interface MapState {
  currentZoom: number;
  currentRegionId: string | null;
  currentDistrictId: number | null;
  visibleBounds: MapBounds | null;
  isAutoZooming: boolean;
}

export interface MapsHookProps {
  onRegionClick: (regionId: string, regionName: string) => void;
  onDistrictClick: (districtId: number, districtName: string) => void;
  onPlantationClick: (plantation: Plantation, map: unknown) => void;
  onMapLoad: (map: unknown) => void;
  accessToken: string | null;
  userRole: string | null;
}

export interface MapsHookReturn {
  mapRef: React.RefObject<HTMLDivElement>;
  initializeMap: () => Promise<void>;
  loadRegionGeoJSON: (regionId: string) => Promise<void>;
  restoreRegionAndDistrict: (regionId: string, districtId: number, districtName?: string) => Promise<void>;
  loading: boolean;
  currentZoom: number;
  mapState: MapState;
}

// Leaflet Types extension
declare global {
  namespace L {
    interface PolygonOptions {
      isPlantation?: boolean;
      isDistrictBoundary?: boolean;
      regionId?: string;
      districtId?: number | string;
    }
  }
}

// =============================================
// MapContainer Types
// =============================================

export type UserRole = 'superuser' | 'headof_region' | 'observer' | 'user' | null;

export type FilterStatus = 'all' | 'approved' | 'rejected' | 'pending' | 'moderation' | 'deleting';

export interface MapFilters {
  status: FilterStatus;
  name: string;
  inn: string;
}

export interface MapPagination {
  count: number;
  next: string | null;
  previous: string | null;
  currentPage: number;
}

export interface SelectedRegion {
  id: string | number;
  name: string;
}

export interface SelectedDistrict {
  id: number;
  name: string;
}

export interface DistrictStats {
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
  stats?: {
    accepted?: number;
    rejected?: number;
    moderation?: number;
  };
}

export interface PlantationImage {
  id?: number;
  image_url: string;
}

export interface FruitArea {
  id?: number;
  fruit: string;
  variety: string;
  area: number;
}

export interface PlantationFarmer {
  id: number;
  name: string;
  inn?: string | number;
  established_year?: string | number;
  director_name?: string;
  phone_number?: string;
  founder_name?: string;
  address?: string;
  resolution_number?: string;
}

export interface PlantationDistrict {
  id: number;
  name: string;
  region: number;
}

export interface PlantationDetail extends Plantation {
  farmer?: PlantationFarmer;
  district?: PlantationDistrict;
  images?: PlantationImage[];
  fruit_areas?: FruitArea[];
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userRole: UserRole;
  regionId?: number | null;
  userInfo?: Record<string, unknown> | null;
}

export interface AuthContextType {
  authState: AuthState;
  login: (data: LoginData & { region_id?: number; user_info?: Record<string, unknown> }) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getUserRegion: () => number | null | undefined;
}

export interface PlantationMapParams {
  page?: number;
  page_size?: number;
  returnFullResponse?: boolean;
  status?: FilterStatus;
  district_id?: number;
  region?: string;
  name?: string;
  inn?: string;
} 