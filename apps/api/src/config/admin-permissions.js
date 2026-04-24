const rolePermissions = {
  super_admin: ['*'],
  manager: [
    'analytics.read',
    'products.read',
    'products.write',
    'orders.read',
    'orders.update',
    'notify.read',
    'notify.update',
    'reviews.read',
    'reviews.moderate',
    'categories.read',
    'categories.write',
    'coupons.read',
    'coupons.write',
    'tools.read',
    'tools.upload',
    'contacts.read',
    'contacts.update',
    'wishlist.read',
  ],
  support: [
    'analytics.read',
    'orders.read',
    'orders.update',
    'notify.read',
    'notify.update',
    'reviews.read',
    'contacts.read',
    'contacts.update',
    'wishlist.read',
    'tools.read',
  ],
};

function hasPermission(role, permission) {
  const permissions = rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(permission);
}

module.exports = {
  hasPermission,
};