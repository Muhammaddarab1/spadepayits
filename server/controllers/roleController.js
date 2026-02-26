// Role management controller for Admin/authorized users
import Role from '../models/Role.js';

export const listRoles = async (_req, res) => {
  const roles = await Role.find().sort({ name: 1 });
  return res.json(roles);
};

export const createRole = async (req, res) => {
  const { name, permissions = {}, description = '' } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const exists = await Role.findOne({ name });
  if (exists) return res.status(409).json({ message: 'Role already exists' });
  const role = await Role.create({ name, permissions, description });
  return res.status(201).json(role);
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { permissions, description, name } = req.body;
  const role = await Role.findById(id);
  if (!role) return res.status(404).json({ message: 'Role not found' });
  if (name) role.name = name;
  if (permissions) role.permissions = permissions;
  if (description !== undefined) role.description = description;
  await role.save();
  return res.json(role);
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  await Role.findByIdAndDelete(id);
  return res.json({ message: 'Role deleted' });
};
