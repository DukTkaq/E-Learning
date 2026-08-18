const { Category } = require('../models');

// [POST] /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const newCategory = await Category.create({
      name,
      description,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Internal server error while creating category' });
  }
};

// [GET] /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['id', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Internal server error while fetching categories' });
  }
};
