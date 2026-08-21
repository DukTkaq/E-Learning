const { Op } = require('sequelize');
const { Category, Course, sequelize } = require('../models');
const AppError = require('../utils/AppError');
const { buildPaginationMeta, parsePagination } = require('../utils/pagination');

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
    const shouldPaginate = ['true', '1'].includes(String(req.query.paginate || '').toLowerCase())
      || Boolean(req.query.page || req.query.limit || req.query.search || req.query.usage);

    if (!shouldPaginate) {
      const categories = await Category.findAll({ order: [['id', 'ASC']] });
      return res.json({ categories });
    }

    const pagination = parsePagination(req.query, { defaultLimit: 8, maxLimit: 50 });
    const search = String(req.query.search || '').trim();
    const usage = String(req.query.usage || '').trim();
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (usage) {
      if (!['in_use', 'empty'].includes(usage)) throw new AppError(400, 'Invalid category usage filter.');
      const usedRows = await Course.findAll({
        attributes: ['category_id'],
        group: ['category_id'],
        raw: true,
      });
      const usedIds = usedRows.map((row) => row.category_id);
      where.id = usage === 'in_use' ? { [Op.in]: usedIds } : { [Op.notIn]: usedIds };
    }

    const { count, rows: categories } = await Category.findAndCountAll({
      where,
      order: [['name', 'ASC'], ['id', 'ASC']],
      limit: pagination.limit,
      offset: pagination.offset,
    });

    const total = await Category.count();
    return res.json({
      categories,
      pagination: buildPaginationMeta({
        page: pagination.page,
        limit: pagination.limit,
        totalItems: count,
      }),
      summary: { total },
    });
  } catch (error) {
    if (error instanceof AppError) return res.status(error.statusCode).json({ message: error.message });
    console.error('Error fetching categories:', error);
    return res.status(500).json({ message: 'Internal server error while fetching categories' });
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
