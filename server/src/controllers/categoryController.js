const { Category, sequelize } = require('../models');

const validateCategoryName = (name) => {
  if (!name || name.trim() === '') {
    return 'Category name cannot be empty.';
  }
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return 'Category name must be between 2 and 100 characters.';
  }
  // Allow alphanumeric, spaces, hyphens, underscores, and Vietnamese characters
  const validFormatRegex = /^[a-zA-Z0-9\s\-_ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]+$/;
  if (!validFormatRegex.test(trimmedName)) {
    return 'Category name contains invalid characters.';
  }
  return null;
};

// [POST] /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const validationError = validateCategoryName(name);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const trimmedName = name.trim();

    // Check unique (case-insensitive)
    const existingCategory = await Category.findOne({ 
      where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
    });
    if (existingCategory) {
      return res.status(400).json({ message: 'This category name already exists.' });
    }

    const newCategory = await Category.create({
      name: trimmedName,
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

// [PUT] /api/categories/:id
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const validationError = validateCategoryName(name);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const trimmedName = name.trim();

    // Check if new name conflicts with an existing category (case-insensitive, other than itself)
    if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
      const existingCategory = await Category.findOne({ 
        where: sequelize.where(sequelize.fn('LOWER', sequelize.col('name')), trimmedName.toLowerCase())
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'This category name already exists.' });
      }
    }

    category.name = trimmedName;
    category.description = description;
    category.updated_at = new Date();
    
    await category.save();

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Internal server error while updating category' });
  }
};

// [DELETE] /api/categories/:id
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await category.destroy();

    res.json({ message: 'Category deleted successfully', id });
  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Check for foreign key constraint violation
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Cannot delete category because it contains courses.' });
    }
    
    res.status(500).json({ message: 'Internal server error while deleting category' });
  }
};
