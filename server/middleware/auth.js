// Authentication middleware validates JWT and attaches user info to request
// - Accepts "Authorization: Bearer <token>" header
// - Or reads "token" from HTTP-only cookies (for cross-domain auth)
import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token && req.headers.cookie) {
    try {
      const pairs = req.headers.cookie.split(';');
      for (const p of pairs) {
        const [k, v] = p.trim().split('=');
        if (k === 'token') {
          token = decodeURIComponent(v || '');
          break;
        }
      }
    } catch {}
  }
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name, email }
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
