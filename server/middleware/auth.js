// Authentication middleware validates JWT and attaches user info to request
// - Accepts "Authorization: Bearer <token>" header (priority)
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

  // debug log for token source
  if (process.env.NODE_ENV !== 'production') {
    console.log('auth middleware token:', token ? token.slice(0, 10) + '...' : 'none');
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, name, email, mustChangePassword }
    if (process.env.NODE_ENV !== 'production') {
      console.log('auth decoded payload', decoded);
    }
    return next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
};
