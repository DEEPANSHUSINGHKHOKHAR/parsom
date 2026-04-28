const path = require('path');

const apiRoot = path.resolve(__dirname, '..', '..');
const uploadsRoot = path.join(apiRoot, 'uploads');

module.exports = {
  apiRoot,
  uploadsRoot,
};
