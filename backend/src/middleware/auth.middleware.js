import { verifyAuthToken } from '../utils/auth.js';

export const ROLE_ADMIN = 'admin';
export const ROLE_STAFF = 'staff';
export const ROLE_SUPPLIER = 'supplier';

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const payload = verifyAuthToken(token);
    req.auth = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.auth || req.auth.role !== ROLE_ADMIN) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return next();
};

export const requireRoles = (...roles) => (req, res, next) => {
  const role = req.auth?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  return next();
};
