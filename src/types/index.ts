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
  land_type?: string;
  crop_type?: string;
  farmer_name?: string;
  farmer?: {
    id: number;
    name: string;
    inn?: string;
  };
  district_id?: number;
  district?: {
    id: number;
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
  moderation_comment?: string | null;
  archived?: boolean;
  created_by?: number;
  garden_established_year?: number;
  planted_area?: number;
  is_deleting?: boolean;
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