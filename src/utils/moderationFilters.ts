// Типы для фильтров модерации
export interface DistrictOption {
  id: string;
  name: string;
}

export type DistrictsByRegion = Record<string, DistrictOption[]>;

export interface BaseFilters {
  region: string;
  district: string;
  farmer?: string;
  plantation_id?: string;
  crop_type?: string;
}

// Список районов по регионам
export const districtsByRegion: DistrictsByRegion = {
  "1": [ // Toshkent
    { id: "1", name: "Oqqorgon" },
    { id: "2", name: "Ohangaron" },
    { id: "3", name: "Bekobod" },
    { id: "4", name: "Bo'stonliq" },
    { id: "5", name: "Bo'ka" },
    { id: "6", name: "Quyi Chirchiq" },
    { id: "7", name: "Zangiota" },
    { id: "8", name: "Toshkent" },
    { id: "9", name: "Yuqori Chirchiq" },
    { id: "10", name: "Qibray" },
    { id: "11", name: "Parkent" },
    { id: "12", name: "Piskent" },
    { id: "13", name: "O'rta Chirchiq" },
    { id: "14", name: "Chinoz" },
    { id: "15", name: "Yangiyo'l" },
  ],
  "2": [ // Andijon
    { id: "16", name: "Andijon t" },
    { id: "17", name: "Asaka" },
    { id: "18", name: "Baliqchi" },
    { id: "19", name: "Buloqboshi" },
    { id: "20", name: "Bo'ston" },
    { id: "21", name: "Jalaquduq" },
    { id: "22", name: "Izboskan" },
    { id: "23", name: "Ulug'nor" },
    { id: "24", name: "Marhamat" },
    { id: "25", name: "Oltinko'l" },
    { id: "26", name: "Paxtaobod" },
    { id: "27", name: "Xo'jaobod" },
    { id: "28", name: "Shahrixon" },
    { id: "29", name: "Qo'rg'ontepa" },
    { id: "30", name: "Andijon sh" },
    { id: "31", name: "Xonobod sh" },
  ],
  "3": [ // Buxoro
    { id: "32", name: "Buxoro t" },
    { id: "33", name: "Vobkent" },
    { id: "35", name: "Kogon" },
    { id: "36", name: "Qorakul" },
    { id: "37", name: "Qorovulbozor" },
    { id: "38", name: "Olot" },
    { id: "39", name: "Peshku" },
    { id: "41", name: "Shofirkon" },
    { id: "42", name: "G'ijduvon" },
    { id: "43", name: "Buxoro sh" },
    { id: "34", name: "Jondor" },
    { id: "40", name: "Romitan" },
  ],
  "4": [ // Farg'ona
    { id: "44", name: "Quvasoy sh" },
    { id: "46", name: "Marg'ilon sh" },
    { id: "47", name: "Farg'ona sh" },
    { id: "48", name: "Beshariq" },
    { id: "50", name: "Buvayda" },
    { id: "51", name: "Dang'ara" },
    { id: "52", name: "Yozyovon" },
    { id: "53", name: "Quva" },
    { id: "54", name: "Oltiariq" },
    { id: "56", name: "Rishton" },
    { id: "57", name: "So'x" },
    { id: "58", name: "Toshloq" },
    { id: "59", name: "O'zbekiston" },
    { id: "61", name: "Farg'ona t" },
    { id: "62", name: "Furqat" },
    { id: "45", name: "Qo'qon sh" },
    { id: "49", name: "Bog'dod" },
    { id: "55", name: "Qo'shtepa" },
    { id: "60", name: "Uchko'prik" },
  ],
  "5": [ // Jizzakh
    { id: "63", name: "Arnasoy" },
    { id: "64", name: "Baxmal" },
    { id: "66", name: "Sh.Rashidov" },
    { id: "67", name: "Do'stlik" },
    { id: "68", name: "Zomin" },
    { id: "69", name: "Zarbdor" },
    { id: "71", name: "Zafarobod" },
    { id: "72", name: "Paxtakor" },
    { id: "73", name: "Forish" },
    { id: "74", name: "Yangiobod" },
    { id: "75", name: "Jizzax sh" },
    { id: "65", name: "G'allaorol" },
    { id: "70", name: "Mirzacho'l" },
  ],
  "6": [ // Qashqadaryo
    { id: "76", name: "G'uzor t" },
    { id: "77", name: "Dehqonobod t" },
    { id: "78", name: "Qamashi t" },
    { id: "79", name: "Qarshi t" },
    { id: "81", name: "Kitob t" },
    { id: "82", name: "Koson t" },
    { id: "83", name: "Muborak t" },
    { id: "84", name: "Nishon t" },
    { id: "85", name: "Mirishkor t" },
    { id: "86", name: "Chiroqchi t" },
    { id: "87", name: "Shahrisabz t" },
    { id: "88", name: "Yakkabog' t" },
    { id: "80", name: "Kasbi t" },
  ],
  "7": [ // Navoiy
    { id: "89", name: "Navoiy" },
    { id: "90", name: "Karmana" },
    { id: "91", name: "Tombi" },
    { id: "92", name: "Qiziltepa" },
    { id: "93", name: "Navbahor" },
    { id: "94", name: "Nurota" },
    { id: "95", name: "Xatirchi" },
    { id: "96", name: "Uchquduq" },
    { id: "97", name: "Zarafshon sh" },
    { id: "98", name: "Navoiy sh" },
  ],
  "8": [ // Namangan
    { id: "98", name: "Namangan t" },
    { id: "97", name: "Kosonsoy" },
    { id: "96", name: "Mingbuloq" },
    { id: "99", name: "Norin" },
    { id: "100", name: "Pop" },
    { id: "101", name: "To'raqo'rg'on" },
    { id: "103", name: "Uchqo'rg'on" },
    { id: "102", name: "Uychi" },
    { id: "106", name: "Yangiqo'rg'on" },
    { id: "104", name: "Chortoq" },
    { id: "105", name: "Chust" },
    { id: "107", name: "Namangan sh" },
  ],
  "9": [ // Samarqand
    { id: "111", name: "Samarqand" },
    { id: "112", name: "Bulung'ur" },
    { id: "113", name: "Ishtixon" },
    { id: "114", name: "Jomboy" },
    { id: "115", name: "Kattaqo'rg'on" },
    { id: "116", name: "Narpay" },
    { id: "117", name: "Nurobod" },
    { id: "118", name: "Oqdaryo" },
    { id: "119", name: "Paxtachi" },
    { id: "120", name: "Payariq" },
    { id: "121", name: "Pastdarg'om" },
    { id: "122", name: "Qo'shrabot" },
    { id: "123", name: "Urgut" },
    { id: "124", name: "Samarqand sh" },
  ],
  "10": [ // Sirdaryo
    { id: "128", name: "Sirdaryo t" },
    { id: "122", name: "Boyovut" },
    { id: "123", name: "Guliston" },
    { id: "125", name: "Oqoltin" },
    { id: "127", name: "Sayxunobod" },
    { id: "129", name: "Sardoba" },
    { id: "129", name: "Xavos" },
    { id: "124", name: "Mirzaobod" },
  ],
  "11": [ // Surxondaryo
    { id: "130", name: "Angor" },
    { id: "131", name: "Bandixon" },
    { id: "132", name: "Boysun" },
    { id: "133", name: "Denov" },
    { id: "134", name: "Jarqo'rg'on" },
    { id: "135", name: "Qiziriq" },
    { id: "136", name: "Qumqo'rg'on" },
    { id: "137", name: "Muzrabot" },
    { id: "138", name: "Oltinsoy" },
    { id: "139", name: "Sariosiyo" },
    { id: "142", name: "Sherobod" },
    { id: "143", name: "Sho'rchi" },
    { id: "140", name: "Termiz sh" },
    { id: "141", name: "Uzun" },
  ],
  "12": [ // Qoraqalpog'iston
    { id: "149", name: "Qoraqalpog'iston" },
    { id: "150", name: "Amudaryo" },
    { id: "151", name: "Beruniy" },
    { id: "152", name: "Chimboy" },
    { id: "153", name: "Ellikqal'a" },
    { id: "154", name: "Kegayli" },
    { id: "155", name: "Mo'ynoq" },
    { id: "156", name: "Nukus" },
    { id: "157", name: "Qanliko'l" },
    { id: "158", name: "Qo'ng'irot" },
    { id: "159", name: "Qorao'zak" },
    { id: "160", name: "Shumanay" },
    { id: "161", name: "Taxtako'pir" },
    { id: "162", name: "To'rtko'l" },
    { id: "163", name: "Xo'jayli" },
  ],
  "13": [ // Xorazm
    { id: "164", name: "Xorazm" },
    { id: "165", name: "Bog'ot" },
    { id: "166", name: "Xonqa" },
    { id: "167", name: "Xiva" },
    { id: "168", name: "Shovot" },
    { id: "169", name: "Yangiariq" },
    { id: "170", name: "Yangibozor" },
    { id: "171", name: "Tuproqqal'a" },
    { id: "172", name: "Xiva sh" },
  ],
};

// Тип для названий регионов
type RegionNames = Record<number, string>;

// Словарь названий регионов
const regionNames: RegionNames = {
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
  13: "Xorazm"
};

/**
 * Получить название региона по ID
 * @param regionId - ID региона (number или string)
 * @returns Название региона или "Noma'lum"
 */
export const getRegionNameById = (regionId?: number | string): string => {
  if (!regionId) return "Noma'lum";
  const id = typeof regionId === 'string' ? parseInt(regionId, 10) : regionId;
  return regionNames[id] || "Noma'lum";
};

/**
 * Получить фильтры из URL параметров
 * @param location - объект location из react-router-dom
 * @param defaultFilters - значения по умолчанию для фильтров
 * @returns Объект с фильтрами
 */
export const getFiltersFromUrl = <T extends BaseFilters>(
  location: { search: string },
  defaultFilters: T
): T => {
  const searchParams = new URLSearchParams(location.search);
  const filters = { ...defaultFilters };
  
  Object.keys(defaultFilters).forEach((key) => {
    const value = searchParams.get(key);
    if (value !== null) {
      (filters as any)[key] = value;
    }
  });
  
  return filters;
};

/**
 * Сохранить фильтры в URL
 * @param navigate - функция navigate из react-router-dom
 * @param pathname - текущий путь
 * @param filters - объект с фильтрами
 * @param page - номер страницы
 */
export const saveFiltersToUrl = <T extends BaseFilters>(
  navigate: (path: string, options?: { replace?: boolean }) => void,
  pathname: string,
  filters: T,
  page: number = 1
): void => {
  const searchParams = new URLSearchParams();
  
  searchParams.set('page', page.toString());
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'All' && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  
  const newUrl = `${pathname}?${searchParams.toString()}`;
  navigate(newUrl, { replace: true });
};

/**
 * Получить список регионов для select
 * @returns Массив объектов { value: string, label: string }
 */
export const getRegionOptions = (): Array<{ value: string; label: string }> => {
  return [
    { value: "All", label: "Barcha viloyatlar" },
    { value: "1", label: "Toshkent" },
    { value: "2", label: "Andijon" },
    { value: "3", label: "Buxoro" },
    { value: "4", label: "Farg'ona" },
    { value: "5", label: "Jizzax" },
    { value: "6", label: "Qashqadaryo" },
    { value: "7", label: "Navoiy" },
    { value: "8", label: "Namangan" },
    { value: "9", label: "Samarqand" },
    { value: "10", label: "Sirdaryo" },
    { value: "11", label: "Surxondaryo" },
    { value: "12", label: "Qoraqalpog'iston" },
    { value: "13", label: "Xorazm" },
  ];
};

/**
 * Получить список районов для выбранного региона
 * @param regionId - ID региона
 * @returns Массив районов или пустой массив
 */
export const getDistrictsByRegion = (regionId: string): DistrictOption[] => {
  if (!regionId || regionId === 'All') return [];
  return districtsByRegion[regionId] || [];
};

