export const FRUIT_TYPES = {
  1: "Olma",
  2: "Nok",
  3: "Uzum",
  4: "Banan",
  5: "Apelsin",
  6: "Mandarin",
  7: "Limon",
  8: "Gilos",
  9: "Shaftoli",
  10: "O'rik",
  11: "Anor",
  12: "Xurmo",
  13: "Injir",
  14: "Bodom",
  15: "Yong'oq",
  16: "Fista",
  17: "Zaytun",
  18: "Avokado",
  19: "Mango",
  20: "Ananas",
  21: "Kivi",
  22: "Granat",
  23: "Malina",
  24: "Klyukva",
  25: "Chernika",
  26: "Yejovika",
  27: "Yemish",
  28: "Temir",
};

export const landTypeMapping = {
  1: "Лалми",
  2: "Тоғ олди",
  3: "Адир",
  4: "Сувли майдон",
};

export const subsidyTypeMapping = {
  1: "Томчилатиб суғориш тизимлари учун",
  2: "Қудуқ/насос станциялари учун",
  3: "Кўчат учун",
  4: "Шпалер учун",
  5: "Лимон учун",
  6: "Муќобил энергия учун",
};

export const trellisTypeMapping = {
  1: "Beton",
  2: "Temir",
};

export const reservoirTypeMapping = {
  1: "Beton",
  2: "Temir",
};

// RBAC System Constants
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  HEAD_OF_REGION: 'headofregion',
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: {
    canViewAllRegions: true,
    canViewAllControllers: true,
    canModerate: true,
    canManageUsers: true,
    canViewStatistics: true,
    canExportData: true,
  },
  [USER_ROLES.MODERATOR]: {
    canViewAllRegions: true,
    canViewAllControllers: true,
    canModerate: true,
    canManageUsers: false,
    canViewStatistics: true,
    canExportData: true,
  },
  [USER_ROLES.HEAD_OF_REGION]: {
    canViewAllRegions: false,
    canViewAllControllers: false,
    canModerate: false,
    canManageUsers: false,
    canViewStatistics: true,
    canExportData: false,
  },
};

export const ROUTE_PERMISSIONS = {
  '/': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.HEAD_OF_REGION],
  '/statistics/controllers': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR, USER_ROLES.HEAD_OF_REGION],
  '/statistics/regions': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/statistics/fruits': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/moderation': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/farmers': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/controllers': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/approved-plantations': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
  '/rejected-plantations': [USER_ROLES.ADMIN, USER_ROLES.MODERATOR],
};
