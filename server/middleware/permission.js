// Permission middleware checks dynamic RBAC permissions
import Role from '../models/Role.js';
import User from '../models/User.js';

export const requirePermission = (perm) => {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const roleName = req.user.role;
      if (roleName === 'Admin') return next(); // shortcut
      const [role, user] = await Promise.all([
        Role.findOne({ name: roleName }),
        User.findById(req.user.id).select('permissions'),
      ]);
      if (!role) return res.status(403).json({ message: 'Forbidden' });
      const userOverride = user?.permissions?.[perm];
      if (userOverride === true) return next();
      if (userOverride === false) return res.status(403).json({ message: 'Forbidden' });
      if (role.permissions?.[perm]) return next();
      return res.status(403).json({ message: 'Forbidden' });
    } catch (e) {
      return res.status(500).json({ message: 'Permission check failed' });
    }
  };
};
