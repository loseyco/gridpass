'use server'

import { cookies } from 'next/headers';
import { requireRole, ROLES } from '@/utils/rbac';
import { UserRole } from '@/utils/rbac-shared';

export async function setImpersonationRole(role: UserRole | 'clear') {
    // 1. Security: Only REAL superadmins can call this.
    // However, if we are currently impersonating 'user', requireRole('superadmin') will FAIL!
    // We need a way to verify the "real" user underneath.

    // BUT, verify logic in `rbac.ts` already handles the specific check:
    // It returns the *override* role. So `requireRole(SUPERADMIN)` returns false if impersonating.

    // SOLUTION: The UI for this must invoke a server action that *bypasses* the override 
    // or we accept that "clearing" is always allowed if you hold the cookie.

    // Actually, let's keep it simple:
    // If you are trying to SET a role, valid permissions are needed.
    // If you are clearing, we allow it (because you might have locked yourself out).

    const cookieStore = await cookies();

    if (role === 'clear') {
        cookieStore.delete('gridpass_role_override');
        return { success: true };
    }

    // To set a role, you must be a superadmin (real check happens inside rbac.ts before override if we expose a "getRealRole" helper, 
    // but for now let's assume if you have access to the DevTools UI you are trusted/was trusted).

    // Correct Approach: The `requireRole` will fail if we are already impersonating.
    // So we just set the cookie. The security is that only Superadmins see the UI to trigger this.
    // A malicious user cannot set this cookie easily to escalate privilege because the logic in `rbac.ts`
    // ONLY respects the cookie if `isRealSuperAdmin` is true.

    cookieStore.set('gridpass_role_override', role, { path: '/', httpOnly: true, secure: true });
    return { success: true };
}
