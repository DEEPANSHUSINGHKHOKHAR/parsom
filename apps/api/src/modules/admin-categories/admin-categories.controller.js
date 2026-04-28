const categoriesService = require('./admin-categories.service');
const { writeAuditLog } = require('../../utils/audit-log');

async function listCategories(req, res, next) {
  try {
    const data = await categoriesService.listCategories();
    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const data = await categoriesService.createCategory(req.body);
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'categories.create',
      resourceType: 'category',
      resourceId: data.categoryId,
      req,
      meta: {
        name: req.body.name,
        audience: req.body.audience,
        parentId: req.body.parentId,
        badge: req.body.badge,
        slug: data.slug,
      },
    });
    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const data = await categoriesService.updateCategory(
      req.params.categoryId,
      req.body
    );
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'categories.update',
      resourceType: 'category',
      resourceId: data.categoryId,
      req,
      meta: req.body,
    });
    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const data = await categoriesService.deleteCategory(req.params.categoryId);
    await writeAuditLog({
      actorType: 'admin',
      actorId: req.user.id,
      actionKey: 'categories.delete',
      resourceType: 'category',
      resourceId: data.categoryId,
      req,
    });
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
