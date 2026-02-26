// User controller provides administrative user operations
import User from '../models/User.js';
import Role from '../models/Role.js';

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email role createdAt updatedAt deleted permissions');
    return res.json(users);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id name email role permissions createdAt updatedAt');
    let permissions = {};
    if (user.role === 'Admin') permissions = { admin: true };
    else {
      const roleDoc = await Role.findOne({ name: user.role });
      permissions = { ...(roleDoc?.permissions || {}), ...(user.permissions || {}) };
    }
    return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions, mustChangePassword: user.mustChangePassword });
  } catch {
    return res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'User', permissions } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });
    const user = await User.create({ name, email, password, role, permissions: permissions || {} });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || {} });
  } catch {
    return res.status(500).json({ message: 'Failed to create user' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role required' });
    const roleDoc = await Role.findOne({ name: role });
    if (!roleDoc && role !== 'Admin') return res.status(400).json({ message: 'Role not defined' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.role = role;
    await user.save();
    return res.json({ id: user._id, role: user.role });
  } catch {
    return res.status(500).json({ message: 'Failed to update role' });
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;
    if (!permissions || typeof permissions !== 'object') return res.status(400).json({ message: 'permissions object required' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.permissions = permissions;
    await user.save();
    return res.json({ id: user._id, permissions: user.permissions });
  } catch {
    return res.status(500).json({ message: 'Failed to update permissions' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.deleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save();
    return res.json({ message: 'Account closed' });
  } catch {
    return res.status(500).json({ message: 'Failed to close account' });
  }
};
