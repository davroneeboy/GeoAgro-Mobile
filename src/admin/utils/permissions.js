import { getUserInfo } from '../../utils/apiUtils';

export const USER_ROLES = {
  REGULAR: 0,
  SUPERUSER: 1,
  HEAD_OF_REGION: 2,
  ONLY_VIEW: 3,
};

export function getCurrentUserRole() {
  const info = getUserInfo();
  return typeof info?.user_role === 'number' ? info.user_role : USER_ROLES.REGULAR;
}

export function checkPermission(requiredRole, userRole) {
  if (userRole === USER_ROLES.SUPERUSER) return true;
  if (userRole === USER_ROLES.HEAD_OF_REGION) return requiredRole <= USER_ROLES.HEAD_OF_REGION;
  return userRole >= requiredRole;
}

export function usePermissions() {
  const role = getCurrentUserRole();
  return {
    canManageUsers: checkPermission(USER_ROLES.SUPERUSER, role),
    canModerate: checkPermission(USER_ROLES.SUPERUSER, role),
    canManageReferences: checkPermission(USER_ROLES.SUPERUSER, role),
    canViewStats: checkPermission(USER_ROLES.ONLY_VIEW, role),
    isSuperuser: role === USER_ROLES.SUPERUSER,
    isHeadOfRegion: role === USER_ROLES.HEAD_OF_REGION,
  };
} 