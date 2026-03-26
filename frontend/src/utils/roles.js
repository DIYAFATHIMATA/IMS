export const ADMIN_ROLE = 'admin';
export const STAFF_ROLE = 'staff';
export const SUPPLIER_ROLE = 'supplier';

export const ROLE_OPTIONS = [ADMIN_ROLE, STAFF_ROLE, SUPPLIER_ROLE];

const LEGACY_ROLE_MAP = {
    super_admin: ADMIN_ROLE,
    company_admin: ADMIN_ROLE,
    admin: ADMIN_ROLE,
    manager: STAFF_ROLE,
    staff: STAFF_ROLE,
    supplier: SUPPLIER_ROLE
};

export const normalizeRole = (role) => {
    if (!role) return role;
    return LEGACY_ROLE_MAP[role] || STAFF_ROLE;
};

export const hasAdminAccess = (user) => normalizeRole(user?.role) === ADMIN_ROLE;
export const hasSupplierAccess = (user) => normalizeRole(user?.role) === SUPPLIER_ROLE;

export const isAllowedRole = (user, allowedRoles = []) => {
    if (!user) return false;
    const normalized = normalizeRole(user.role);
    return allowedRoles.includes(normalized);
};
