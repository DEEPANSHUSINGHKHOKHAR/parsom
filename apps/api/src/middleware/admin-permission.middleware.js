const AppError = require('../utils/app-error');
const { hasPermission } = require('../config/admin-permissions');

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required.'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError(403, 'You do not have permission for this action.'));
    }

    next();
  };
}

module.exports = {
  requirePermission,
};