// Blocks access to most features until the user changes their password after first login
export const passwordGuard = (req, res, next) => {
  // Allow if not authenticated yet (no req.user)
  if (!req.user) return next();
  // Allow if requirement is satisfied
  if (!req.user.mustChangePassword) return next();
  // Always allow these exceptions to enable changing password and viewing profile
  const allowed = [
    { method: 'POST', path: '/api/auth/change-password' },
    { method: 'GET', path: '/api/users/me' },
  ];
  const pass = allowed.some(a => a.method === req.method && req.path.startsWith(a.path));
  if (pass) return next();
  return res.status(423).json({ message: 'Password change required on first login' });
};
