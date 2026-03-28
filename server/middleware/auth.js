// Authentication middleware validates JWT and attaches user info to request
// - Accepts "Authorization: Bearer <token>" header (priority)
// - Or reads "token" from HTTP-only cookies (for cross-domain auth)
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Role from '../models/Role.js';

export const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token && req.headers.cookie) {
    try {
      const pairs = req.headers.cookie.split(';');
      for (const p of pairs) {
        const [k, v] = p.trim().split('=');
        if (k.toLowerCase() === 'token') {
          token = decodeURIComponent(v || '');
          break;
        }
      }
    } catch {}
  }

  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user and permissions from DB to ensure they are current and complete
    const user = await User.findById(decoded.id).select('_id name email role permissions mustChangePassword');
    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    let permissions = {};
    if (user.role === 'Admin') permissions = { admin: true };
    else {
      const roleDoc = await Role.findOne({ name: user.role });
      permissions = { ...(roleDoc?.permissions || {}), ...(user.permissions || {}) };
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      name: user.name,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
      permissions,
    };

    return next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return res.status(401).json({ message: msg });
  }
};
