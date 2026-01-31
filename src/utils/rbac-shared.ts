// This file contains constants and types SAFE for Client Components
// It must NOT import anything from 'next/headers' or '@/utils/supabase/server'
import { Database } from '@/types/supabase';

export type UserRole = Database['public']['Enums']['user_role'];

// Known system permissions
export const PERMISSIONS = {
    // Admin
    ACCESS_ADMIN: 'admin.access',
    VIEW_USERS: 'users.view',
    MANAGE_USERS: 'users.manage',
    MANAGE_ROLES: 'roles.manage',

    // Features
    ACCESS_BETA: 'beta.access',
    VIEW_CLASSIFIEDS: 'classifieds.view',
    POST_CLASSIFIEDS: 'classifieds.post',

    // System
    VIEW_TELEMETRY: 'telemetry.view'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const KNOWN_PERMISSIONS = Object.values(PERMISSIONS);

export const ROLES = {
    SUPERADMIN: 'superadmin' as UserRole,
    ADMIN: 'admin' as UserRole,
    FOUNDER: 'founder' as UserRole,
    MEMBER: 'member' as UserRole,
    USER: 'user' as UserRole,
    PUBLIC: 'public' as UserRole // Virtual role for testing
};
