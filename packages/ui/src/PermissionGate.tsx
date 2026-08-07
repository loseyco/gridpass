'use client';

import React from 'react';
import { PermissionKey, GridpassUserProfile, hasPermission } from '@gridpass/db';

interface PermissionGateProps {
  user: GridpassUserProfile | null;
  permission: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({ user, permission, children, fallback = null }: PermissionGateProps) {
  const allowed = hasPermission(user, permission);
  if (!allowed) {
    return fallback ? <>{fallback}</> : null;
  }
  return <>{children}</>;
}
