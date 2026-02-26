import Tag from '../models/Tag.js';

export const listTags = async (_req, res) => {
  try {
    const tags = await Tag.find({ active: true }).sort({ name: 1 });
    return res.json(tags);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch tags' });
  }
};

export const listAllTags = async (_req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    return res.json(tags);
  } catch {
    return res.status(500).json({ message: 'Failed to fetch tags' });
  }
};

export const createTag = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const exists = await Tag.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Tag already exists' });
    const tag = await Tag.create({ name });
    return res.status(201).json(tag);
  } catch {
    return res.status(500).json({ message: 'Failed to create tag' });
  }
};

export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active } = req.body;
    const tag = await Tag.findById(id);
    if (!tag) return res.status(404).json({ message: 'Tag not found' });
    if (name) tag.name = name;
    if (active !== undefined) tag.active = active;
    await tag.save();
    return res.json(tag);
  } catch {
    return res.status(500).json({ message: 'Failed to update tag' });
  }
};

export const deleteTag = async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Tag deleted' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete tag' });
  }
};
