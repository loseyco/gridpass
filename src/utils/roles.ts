export type Role = 'owner' | 'manager' | 'technician';

export const ROLES = {
    OWNER: 'owner' as Role,
    MANAGER: 'manager' as Role,
    TECHNICIAN: 'technician' as Role,
};

export function canManageShop(role: string): boolean {
    return [ROLES.OWNER, ROLES.MANAGER].includes(role as Role);
}

export function canEditCustomers(role: string): boolean {
    return [ROLES.OWNER, ROLES.MANAGER].includes(role as Role);
}

export function canEditVehicles(role: string): boolean {
    return [ROLES.OWNER, ROLES.MANAGER].includes(role as Role);
}

export function canViewFinancials(role: string): boolean {
    return [ROLES.OWNER].includes(role as Role);
}
