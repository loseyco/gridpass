export type UserRole =
  | 'SUPER_ADMIN'
  | 'SL_ADMIN'
  | 'OFFROAD_ADMIN'
  | 'SIM_ADMIN'
  | 'FOODTRUCK_ADMIN'
  | 'VENUE_OPERATOR'
  | 'BUSINESS_OWNER'
  | 'DRIVER_MEMBER'
  | 'GUEST_SPECTATOR';

export type PermissionKey =
  | 'db:explore'
  | 'analytics:global'
  | 'changelog:write'
  | 'sl:manage_sims'
  | 'sl:view_telemetry'
  | 'offroad:scan_gate'
  | 'offroad:manage_waivers'
  | 'foodtruck:manage_menu'
  | 'srcommander:manage_rigs'
  | 'vehicle:create';

const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  SUPER_ADMIN: [
    'db:explore',
    'analytics:global',
    'changelog:write',
    'sl:manage_sims',
    'sl:view_telemetry',
    'offroad:scan_gate',
    'offroad:manage_waivers',
    'foodtruck:manage_menu',
    'srcommander:manage_rigs',
    'vehicle:create',
  ],
  SL_ADMIN: ['sl:manage_sims', 'sl:view_telemetry'],
  OFFROAD_ADMIN: ['offroad:scan_gate', 'offroad:manage_waivers'],
  SIM_ADMIN: ['srcommander:manage_rigs'],
  FOODTRUCK_ADMIN: ['foodtruck:manage_menu'],
  VENUE_OPERATOR: ['offroad:scan_gate', 'offroad:manage_waivers'],
  BUSINESS_OWNER: ['foodtruck:manage_menu'],
  DRIVER_MEMBER: ['vehicle:create'],
  GUEST_SPECTATOR: [],
};

export interface GridpassUserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  roles?: UserRole[];
  credits?: number;
}

export function hasPermission(user: GridpassUserProfile | null, permission: PermissionKey): boolean {
  if (!user || !user.roles || user.roles.length === 0) return false;
  
  // SUPER_ADMIN override
  if (user.roles.includes('SUPER_ADMIN')) return true;

  return user.roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
  });
}
